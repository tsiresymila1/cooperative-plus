import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { router, useLocalSearchParams } from "expo-router";
import { ChevronLeft, CircleDot, Clock, DoorOpen } from "lucide-react-native";
import { Badge, Button, Card, Spinner } from "@/components/ui";
import { CoopLogo } from "@/components/coop-logo";
import { MessageDialog, type Notice } from "@/components/ui/message-dialog";
import { cn, fmtMoney } from "@/lib/cn";
import { db, id, type Chunk } from "@/lib/db";
import { useAuth } from "@/lib/auth";
import { useSelection, type HeldSeat } from "@/lib/selection";
import {
  fmtDateKey,
  fmtTime,
  HOLD_DURATION_MS,
  parseSeatLayout,
  seatKeyFor,
  seatLabel,
  type SeatCell,
} from "@/lib/domain";

export default function TripDetail() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { setSelection } = useSelection();
  const params = useLocalSearchParams<{ id: string }>();
  const tripId = params.id;

  const [selected, setSelected] = useState<Record<string, true>>({}); // by seatLabel
  const [holding, setHolding] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const nowKey = useMemo(() => Date.now(), []); // stable for the where filter
  const { isLoading, error, data } = db.useQuery({
    tripInstances: {
      $: { where: { id: tripId } },
      route: {},
      cooperative: {},
      tickets: {},
      holds: { $: { where: { expiresAt: { $gt: new Date(nowKey) } } } },
      vehicle: { seatMaps: {} },
    },
  });

  const trip = data?.tripInstances?.[0];


  // Taken seat labels = booked tickets + live (unexpired) holds.
  const takenLabels = useMemo(() => {
    const set = new Set<string>();
    for (const tk of trip?.tickets ?? []) set.add(tk.seatLabel);
    for (const h of trip?.holds ?? []) set.add(h.seatLabel);
    return set;
  }, [trip]);

  // Same source as the web booking page: the vehicle's active seat map, with
  // the trip snapshot as a fallback. Keeps mobile + web layouts identical.
  const cells: SeatCell[] = useMemo(() => {
    if (!trip) return [];
    const maps = (trip as any).vehicle?.seatMaps ?? [];
    const active = maps.find((m: any) => m.isActive) ?? maps[0];
    const layout = Array.isArray(active?.layout) ? active.layout : trip.seatMapSnapshot;
    return parseSeatLayout(layout, trip.seatsTotal);
  }, [trip]);

  const selectedLabels = Object.keys(selected);

  function toggle(label: string) {
    if (takenLabels.has(label)) return;
    setSelected((prev) => {
      const next = { ...prev };
      if (next[label]) delete next[label];
      else next[label] = true; // free selection: any number of seats
      return next;
    });
  }

  async function proceed() {
    if (!trip) return;
    if (!user) {
      router.push("/sign-in");
      return;
    }
    if (selectedLabels.length === 0) return;

    setHolding(true);
    const expiresAt = Date.now() + HOLD_DURATION_MS;
    const created: HeldSeat[] = [];
    try {
      // seatKey is .unique(): an EXPIRED hold left behind by an abandoned
      // session still occupies the key and would block re-holding the (now free)
      // seat. Fetch those stale holds so we can clear them in the same tx.
      const { data: stale } = await db.queryOnce({
        tripInstances: {
          $: { where: { id: trip.id } },
          holds: { $: { where: { expiresAt: { $lte: new Date() } } } },
        },
      });
      const staleByLabel = new Map<string, string>();
      for (const h of stale?.tripInstances?.[0]?.holds ?? []) staleByLabel.set(h.seatLabel, h.id);

      // Create one hold per seat. A duplicate create on an ACTIVE key throws
      // (seat just taken by someone else).
      for (const label of selectedLabels) {
        const holdId = id();
        const seatKey = seatKeyFor(trip.id, label);
        const chunks: Chunk[] = [];
        const staleId = staleByLabel.get(label);
        if (staleId) chunks.push(db.tx.seatHolds[staleId]!.delete());
        chunks.push(
          db.tx.seatHolds[holdId]!
            .update({
              seatKey,
              seatLabel: label,
              expiresAt,
              createdAt: Date.now(),
            })
            .link({ tripInstance: trip.id, user: user.id }),
        );
        if (trip.cooperative?.id) {
          chunks.push(db.tx.seatHolds[holdId]!.link({ cooperative: trip.cooperative.id }));
        }
        await db.transact(chunks);
        created.push({ holdId, seatLabel: label, seatKey });
      }

      setSelection({
        tripInstanceId: trip.id,
        coopName: trip.coopName,
        routeName: trip.routeName,
        originName: trip.originName,
        destName: trip.destName,
        departDate: trip.departDate,
        departureAt: trip.departureAt as number | string | null,
        price: trip.price,
        currency: trip.currency,
        cooperativeId: trip.cooperative?.id,
        seats: created,
        holdExpiresAt: expiresAt,
      });
      router.push("/checkout");
    } catch (e) {
      // Roll back any holds we did manage to create, then inform the user.
      if (created.length > 0) {
        await db
          .transact(created.map((h) => db.tx.seatHolds[h.holdId]!.delete()))
          .catch(() => {});
      }
      setSelected({});
      console.warn("[trip] hold failed:", e);
      setNotice({
        title: "Siège déjà pris",
        message: "Un des sièges sélectionnés vient d'être réservé. Choisissez d'autres places.",
      });
    } finally {
      setHolding(false);
    }
  }

  const total = trip ? trip.price * selectedLabels.length : 0;

  return (
    <View className="flex-1 bg-sand" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center gap-3 px-5 py-3">
        <Pressable onPress={() => router.back()} className="h-9 w-9 items-center justify-center rounded-[4px] border border-ink/10 bg-paper">
          <ChevronLeft size={20} color="#16266b" />
        </Pressable>
        <Text className="font-display text-lg text-ink">Détail du trajet</Text>
      </View>

      {isLoading ? (
        <Spinner />
      ) : error || !trip ? (
        <Text className="px-5 font-sans text-sm text-laterite-deep">Trajet introuvable.</Text>
      ) : (
        <>
          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 160 }} showsVerticalScrollIndicator={false}>
            <Animated.View entering={FadeIn.duration(300)}>
              <Card>
                <View className="flex-row items-center gap-2.5">
                  <CoopLogo url={trip.cooperative?.logoUrl} brandColor={trip.cooperative?.brandColor} name={trip.coopName} size={40} />
                  <View>
                    <Text className="font-sans text-sm font-semibold text-laterite">{trip.coopName}</Text>
                    <Text className="font-mono text-[11px] text-ink-soft/60">{trip.vehicleName}</Text>
                  </View>
                </View>
                <View className="mt-3 flex-row items-center gap-2">
                  <Text className="font-display text-2xl text-ink">{trip.originName}</Text>
                  <Text className="text-laterite">→</Text>
                  <Text className="font-display text-2xl text-laterite">{trip.destName}</Text>
                </View>
                <View className="mt-3 flex-row items-center gap-4">
                  <View className="flex-row items-center gap-1.5">
                    <Clock size={14} color="#4a5680" />
                    <Text className="font-mono text-sm text-ink-soft">
                      {fmtTime(trip.departureAt)}
                      {trip.arrivalEstimateAt ? ` → ${fmtTime(trip.arrivalEstimateAt)}` : ""}
                    </Text>
                  </View>
                  <Text className="font-mono text-sm text-ink-soft">{fmtDateKey(trip.departDate)}</Text>
                </View>
                <View className="mt-3 flex-row items-center justify-between">
                  <Text className="font-mono text-xl text-ink">{fmtMoney(trip.price, trip.currency)} / place</Text>
                  <Badge
                    tone={(trip.tickets?.length ?? 0) >= trip.seatsTotal ? "danger" : "success"}
                    label={`${trip.tickets?.length ?? 0}/${trip.seatsTotal} places`}
                  />
                </View>
              </Card>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(120).duration(420)} className="mt-5">
              <View className="mb-3">
                <Text className="font-display text-lg text-ink">Choisir vos sièges</Text>
                <Text className="mt-0.5 font-mono text-xs text-ink-soft/60">
                  {selectedLabels.length > 0
                    ? `${selectedLabels.length} siège${selectedLabels.length > 1 ? "s" : ""} sélectionné${selectedLabels.length > 1 ? "s" : ""}`
                    : "Touchez les sièges libres"}
                </Text>
              </View>
              <View className="items-center">
                <SeatMap cells={cells} takenLabels={takenLabels} selected={selected} onToggle={toggle} />
              </View>
            </Animated.View>
          </ScrollView>

          {/* Sticky footer */}
          <View
            className="absolute inset-x-0 bottom-0 border-t border-ink/10 bg-paper px-5 pt-3"
            style={{ paddingBottom: insets.bottom + 12 }}
          >
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="font-sans text-sm text-ink-soft">
                {selectedLabels.length > 0 ? selectedLabels.join(", ") : "Aucun siège"}
              </Text>
              <Text className="font-mono text-lg text-ink">{fmtMoney(total, trip.currency)}</Text>
            </View>
            <Button onPress={proceed} disabled={selectedLabels.length === 0 || holding}>
              <Text className="font-sans font-medium text-paper">
                {holding ? "Réservation…" : user ? "Continuer vers le paiement" : "Se connecter pour réserver"}
              </Text>
            </Button>
          </View>
        </>
      )}

      <MessageDialog notice={notice} onDismiss={() => setNotice(null)} />
    </View>
  );
}

function SeatMap({
  cells,
  takenLabels,
  selected,
  onToggle,
}: {
  cells: SeatCell[];
  takenLabels: Set<string>;
  selected: Record<string, true>;
  onToggle: (label: string) => void;
}) {
  // Build a row → (col → cell) grid so each cell renders at its absolute column.
  // This keeps the aisle / driver aligned exactly like the cooperative's layout.
  const { maxRow, maxCol, at } = useMemo(() => {
    const map = new Map<string, SeatCell>();
    let mr = 0;
    let mc = 0;
    for (const c of cells) {
      mr = Math.max(mr, c.row);
      mc = Math.max(mc, c.col);
      map.set(`${c.row}:${c.col}`, c);
    }
    return { maxRow: mr, maxCol: mc, at: (r: number, c: number) => map.get(`${r}:${c}`) };
  }, [cells]);

  let seatIdx = -1;
  return (
    <View className="w-full rounded-[4px] border border-ink/10 bg-sand-deep/40 p-4">
      <Text className="mb-3 text-center font-mono text-[10px] uppercase tracking-widest text-ink-soft/55">
        ↑ avant du véhicule
      </Text>
      <View className="w-full flex-1 items-center gap-3">
        {Array.from({ length: maxRow + 1 }, (_, r) => (
          <View key={r} className="flex-row justify-between gap-3">
            {Array.from({ length: maxCol + 1 }, (_, col) => {
              const cell = at(r, col);
              if (cell?.type === "driver") {
                return (
                  <View key={col} className="h-14 w-14 items-center justify-center rounded-[4px] border border-ink/15 bg-ink/5">
                    <CircleDot size={16} color="#4a5680" />
                  </View>
                );
              }
              if (cell?.type === "door") {
                return (
                  <View key={col} className="h-14 w-14 items-center justify-center rounded-[4px] border border-dashed border-ink/20">
                    <DoorOpen size={16} color="#4a568088" />
                  </View>
                );
              }
              if (!cell || cell.type !== "seat") {
                return <View key={col} className="h-14 w-14" />;
              }
              seatIdx += 1;
              const label = seatLabel(cell, seatIdx);
              const isTaken = takenLabels.has(label);
              const isSel = !!selected[label];
              return (
                <Pressable
                  key={col}
                  disabled={isTaken}
                  onPress={() => onToggle(label)}
                  style={
                    isSel
                      ? { shadowColor: "#f5821f", shadowOpacity: 0.5, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 6 }
                      : undefined
                  }
                  className={cn(
                    "h-14 w-14 items-center justify-center rounded-[4px] border active:opacity-80",
                    isTaken
                      ? "border-ink/10 bg-ink/10"
                      : isSel
                        ? "border-laterite bg-laterite"
                        : "border-ink/15 bg-paper",
                  )}
                >
                  <Text
                    className={cn(
                      "font-mono text-xs font-semibold",
                      isTaken ? "text-ink-soft/40 line-through" : isSel ? "text-paper" : "text-ink",
                    )}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      {/* Legend */}
      <View className="mt-4 flex-row flex-wrap justify-center gap-4">
        <LegendItem className="border-ink/15 bg-paper" label="Libre" />
        <LegendItem className="border-laterite bg-laterite" label="Choisi" />
        <LegendItem className="border-ink/10 bg-ink/10" label="Occupé" />
      </View>
    </View>
  );
}

function LegendItem({ className, label }: { className: string; label: string }) {
  return (
    <View className="flex-row items-center gap-1.5">
      <View className={cn("h-4 w-4 rounded-full border", className)} />
      <Text className="font-sans text-xs text-ink-soft">{label}</Text>
    </View>
  );
}
