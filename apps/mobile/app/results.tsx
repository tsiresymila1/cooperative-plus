import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowRight, Bus, ChevronLeft, ChevronRight } from "lucide-react-native";
import { Spinner } from "@/components/ui";
import { RouteTimeline } from "@/components/route-timeline";
import { TagBadge } from "@/components/tag-badge";
import { useColors } from "@/lib/colors";
import { cn, fmtMoney } from "@/lib/cn";
import { db } from "@/lib/db";
import { fmtDateKey, fmtTime, toMs } from "@/lib/domain";

/** "3h 30m" from two epoch-ms timestamps. */
function durationLabel(startMs: number, endMs: number): string {
  const mins = Math.max(0, Math.round((endMs - startMs) / 60000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m > 0 ? `${m}m` : ""}`.trim() : `${m}m`;
}

export default function Results() {
  const insets = useSafeAreaInsets();
  const c = useColors();
  const params = useLocalSearchParams<{ origin?: string; dest?: string; date?: string }>();
  const origin = params.origin ?? "";
  const dest = params.dest ?? "";
  const date = params.date ?? "";

  const { isLoading, error, data } = db.useQuery({
    tripInstances: {
      $: {
        where: { originName: origin, destName: dest, departDate: date, status: "scheduled" },
        order: { departureAt: "asc" },
      },
      route: {},
      cooperative: {},
      tickets: { booking: {} },
      tag: {},
    },
  });

  // Availability from issued tickets — excluding cancelled/expired bookings.
  const DEAD = ["cancelled", "expired", "refunded"];
  const liveTickets = (t: { tickets?: any[] }) =>
    (t.tickets ?? []).filter((tk) => !DEAD.includes(tk.booking?.status));
  const seatsLeft = (t: { seatsTotal: number; tickets?: any[] }) =>
    t.seatsTotal - liveTickets(t).length;
  const nowMs = Date.now();
  // Only seats left AND departure still in the future (hide departed trips).
  const trips = (data?.tripInstances ?? []).filter(
    (t) => seatsLeft(t) >= 1 && toMs(t.departureAt) > nowMs,
  );

  return (
    <View className="flex-1 bg-sand">
      {/* Navy header band */}
      <View className="rounded-b-[20px] bg-strong px-5 pb-6" style={{ paddingTop: insets.top + 8 }}>
        <View className="flex-row items-center gap-3">
          <Pressable onPress={() => router.back()} className="h-9 w-9 items-center justify-center rounded-full bg-white/15">
            <ChevronLeft size={20} color="#ffffff" />
          </Pressable>
          <Text className="font-display text-lg uppercase tracking-wide text-white">Trajets</Text>
        </View>

        {/* Trajet en bas du header */}
        <View className="mt-5 flex-row items-center gap-2">
          <Text className="font-display text-2xl text-white" numberOfLines={1}>{origin}</Text>
          <ArrowRight size={18} color="#D9A441" />
          <Text className="flex-1 font-display text-2xl text-laterite" numberOfLines={1}>{dest}</Text>
        </View>
        <Text className="mt-1.5 font-mono text-xs text-white/70">
          {fmtDateKey(date)}
          {!isLoading && !error ? ` · ${trips.length} départ${trips.length > 1 ? "s" : ""}` : ""}
        </Text>
      </View>

      {isLoading ? (
        <Spinner />
      ) : error ? (
        <Text className="px-5 pt-5 font-sans text-sm text-laterite-deep">Erreur de chargement. Réessayez.</Text>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {trips.length === 0 ? (
            <View className="items-center pt-16">
              <View className="h-14 w-14 items-center justify-center rounded-full bg-ink/5">
                <Bus size={26} color="#4a5680" />
              </View>
              <Text className="mt-4 font-display text-xl text-ink">Aucun départ trouvé</Text>
              <Text className="mt-2 text-center font-sans text-sm text-ink-soft/70">
                Pas de trajet {origin} → {dest} le {fmtDateKey(date)}.
              </Text>
            </View>
          ) : (
            <>
              {trips.map((t, i) => {
                const booked = liveTickets(t).length;
                const full = booked >= t.seatsTotal;
                return (
                  <Animated.View key={t.id} entering={FadeInDown.delay(i * 70).duration(420)}>
                    <Pressable onPress={() => router.push({ pathname: "/trip/[id]", params: { id: t.id } })} className="relative my-2">
                      {(t as any).tag && (
                        <View className="absolute right-3 z-20" style={{ top: -8 }}>
                          <TagBadge name={(t as any).tag.name} color={(t as any).tag.color} />
                        </View>
                      )}
                      <View className="mb-3 rounded-2xl bg-paper p-4 shadow-sm shadow-black/10">
                        {/* Top: coop name + vehicle */}
                        <View className="flex-row items-center justify-between gap-2">
                          <View className="flex-1 flex-row items-center gap-2">
                            <Bus size={16} color="#14314C" />
                            <Text className="flex-1 font-sans text-sm font-bold text-ink" numberOfLines={1}>{t.coopName}</Text>
                          </View>
                          <View className="rounded-full bg-laterite/10 px-2.5 py-1">
                            <Text className="font-mono text-[11px] font-semibold text-laterite" numberOfLines={1}>{t.vehicleName}</Text>
                          </View>
                        </View>

                        {/* Times + timeline */}
                        <View className="mt-3 flex-row items-center">
                          <View>
                            <Text className="font-mono text-[10px] uppercase tracking-wide text-ink-soft/50" numberOfLines={1}>{origin}</Text>
                            <Text className="mt-0.5 font-mono text-base font-bold text-ink">{fmtTime(t.departureAt)}</Text>
                          </View>
                          <RouteTimeline className="mx-3 flex-1" />
                          <View className="items-end">
                            <Text className="font-mono text-[10px] uppercase tracking-wide text-ink-soft/50" numberOfLines={1}>{dest}</Text>
                            <Text className="mt-0.5 font-mono text-base font-bold text-ink">
                              {t.arrivalEstimateAt ? fmtTime(t.arrivalEstimateAt) : "—"}
                            </Text>
                          </View>
                        </View>
                        {t.arrivalEstimateAt ? (
                          <Text className="mt-1 text-center font-mono text-[10px] text-ink-soft/45">
                            Estimé {durationLabel(toMs(t.departureAt), toMs(t.arrivalEstimateAt))}
                          </Text>
                        ) : null}

                        {/* Footer: price + seats left / seat-picker link */}
                        <View
                          className="mt-3 flex-row items-center justify-between pt-3"
                          style={{ borderTopWidth: 1, borderStyle: "dashed", borderColor: "#14314C22" }}
                        >
                          <View>
                            <Text className="font-mono text-base font-bold text-ink">{fmtMoney(t.price, t.currency)}</Text>
                            <Text className={cn(
                              "font-mono text-xs font-semibold",
                              full ? "text-laterite-deep" : booked / t.seatsTotal >= 0.8 ? "text-clay" : "text-green",
                            )}>
                              {full ? "Complet" : `${t.seatsTotal - booked} place${t.seatsTotal - booked > 1 ? "s" : ""} restante${t.seatsTotal - booked > 1 ? "s" : ""}`}
                            </Text>
                          </View>
                          <View className="flex-row items-center gap-1">
                            <Text className="font-sans text-sm font-bold text-laterite">Voir places</Text>
                            <ChevronRight size={16} color="#D9A441" />
                          </View>
                        </View>
                      </View>
                    </Pressable>
                  </Animated.View>
                );
              })}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}
