import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowRight, Bus, ChevronLeft, ChevronRight } from "lucide-react-native";
import { Badge, Card, Spinner } from "@/components/ui";
import { CoopLogo } from "@/components/coop-logo";
import { useColors } from "@/lib/colors";
import { fmtMoney } from "@/lib/cn";
import { db } from "@/lib/db";
import { fmtDateKey, fmtTime, toMs } from "@/lib/domain";

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
      tickets: {},
    },
  });

  // Availability is derived from issued tickets (the booking source of truth).
  const seatsLeft = (t: { seatsTotal: number; tickets?: unknown[] }) =>
    t.seatsTotal - (t.tickets?.length ?? 0);
  const nowMs = Date.now();
  // Only seats left AND departure still in the future (hide departed trips).
  const trips = (data?.tripInstances ?? []).filter(
    (t) => seatsLeft(t) >= 1 && toMs(t.departureAt) > nowMs,
  );

  return (
    <View className="flex-1 bg-sand">
      {/* Header banner */}
      <View className="rounded-b-[4px]  px-5 pb-5" style={{ paddingTop: insets.top + 8 }}>
        <View className="flex-row items-center gap-3">
          <Pressable onPress={() => router.back()} className="h-9 w-9 items-center justify-center rounded-[4px] border border-ink/10 bg-paper">
            <ChevronLeft size={20} color={c.ink} />
          </Pressable>
          <Text className="font-display text-lg text-ink">Recherche de trajet</Text>
        </View>

        {/* Trajet en bas du header */}
        <View className="mt-5 flex-row items-center gap-2">
          <Text className="font-display text-2xl text-ink" numberOfLines={1}>{origin}</Text>
          <ArrowRight size={18} color="#f5821f" />
          <Text className="font-display text-2xl text-orange" numberOfLines={1}>{dest}</Text>
        </View>
        <Text className="mt-1.5 font-mono text-xs text-ink-soft/70">
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
              <View className="h-14 w-14 items-center justify-center rounded-[4px] bg-ink/5">
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
                const booked = t.tickets?.length ?? 0;
                const full = booked >= t.seatsTotal;
                return (
                  <Animated.View key={t.id} entering={FadeInDown.delay(i * 70).duration(420)}>
                    <Pressable onPress={() => router.push({ pathname: "/trip/[id]", params: { id: t.id } })}>
                      <Card className="mb-3 p-0">
                        {/* Top: coop + seats */}
                        <View className="flex-row items-center justify-between px-4 pt-3">
                          <View className="flex-1 flex-row items-center gap-2">
                            <CoopLogo url={t.cooperative?.logoUrl} brandColor={t.cooperative?.brandColor} name={t.coopName} size={32} />
                            <Text className="font-sans text-sm font-semibold text-laterite" numberOfLines={1}>{t.coopName}</Text>
                          </View>
                          <Badge
                            tone={full ? "danger" : booked / t.seatsTotal >= 0.8 ? "warning" : "success"}
                            label={full ? "Complet" : `${booked}/${t.seatsTotal} places`}
                          />
                        </View>

                        {/* Time row */}
                        <View className="flex-row items-center gap-3 px-4 pt-2">
                          <Text className="font-mono text-2xl text-ink">{fmtTime(t.departureAt)}</Text>
                          <View className="flex-1 flex-row items-center gap-1.5">
                            <View className="h-2 w-2 rounded-full border border-ink/30" />
                            <View className="h-px flex-1 bg-ink/15" />
                            <Bus size={13} color="#4a5680" />
                            <View className="h-px flex-1 bg-ink/15" />
                            <View className="h-2 w-2 rounded-full bg-laterite" />
                          </View>
                          <Text className="font-mono text-2xl text-ink-soft">
                            {t.arrivalEstimateAt ? fmtTime(t.arrivalEstimateAt) : "—"}
                          </Text>
                        </View>

                        {/* Footer: vehicle + price */}
                        <View className="mt-3 flex-row items-center justify-between border-t border-ink/8 px-4 py-3">
                          <View className="flex-row items-center gap-1.5">
                            <Bus size={13} color="#4a5680" />
                            <Text className="font-mono text-xs text-ink-soft/70">{t.vehicleName}</Text>
                          </View>
                          <View className="flex-row items-center gap-1">
                            <Text className="font-mono text-lg text-ink">{fmtMoney(t.price, t.currency)}</Text>
                            <ChevronRight size={18} color="#f5821f" />
                          </View>
                        </View>
                      </Card>
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
