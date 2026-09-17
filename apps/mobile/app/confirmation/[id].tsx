import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";
import { router, useLocalSearchParams } from "expo-router";
import {
  Armchair,
  CheckCircle2,
  ChevronLeft,
  Download,
  MapPin,
  Printer,
} from "lucide-react-native";
import QRCode from "react-native-qrcode-svg";
import { Badge, Button, Spinner } from "@/components/ui";
import { CoopLogo } from "@/components/coop-logo";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { SeatMapView } from "@/components/seat-map";
import { fmtMoney } from "@/lib/cn";
import { db } from "@/lib/db";
import {
  bookingStatusFr,
  fmtDateKey,
  fmtTime,
  parseSeatLayout,
} from "@/lib/domain";
import { printTicket, shareTicketPdf } from "@/lib/ticket-pdf";
import { TagBadge } from "@/components/tag-badge";
import { useColors } from "@/lib/colors";

export default function Confirmation() {
  const insets = useSafeAreaInsets();
  const { id: bookingId } = useLocalSearchParams<{ id: string }>();

  const { isLoading, data } = db.useQuery({
    bookings: {
      $: { where: { id: bookingId } },
      tickets: { tripVehicle: {} },
      tripInstance: {
        cooperative: {},
        vehicle: { seatMaps: {} },
        tickets: {},
        tag: {},
      },
    },
  });

  const booking = data?.bookings?.[0];
  const trip = booking?.tripInstance;
  const tickets = booking?.tickets ?? [];

  // Vehicle/driver: from the ticket's tripVehicle (multi-vehicle), else the trip.
  const tv: any = tickets.map((t: any) => t.tripVehicle).find(Boolean);
  const vehLabel = tv?.label ?? "Voiture 1";
  const vehReg =
    tv?.registrationNo ?? (trip as any)?.vehicle?.registrationNo ?? null;
  const vehDriver = tv?.driverName ?? (trip as any)?.driverName ?? null;

  const [seatsOpen, setSeatsOpen] = useState(false);
  // Seat map cells = vehicle active map (fallback to snapshot), like the booking page.
  const cells = (() => {
    if (!trip) return [];
    const maps = (trip as any).vehicle?.seatMaps ?? [];
    const active = maps.find((m: any) => m.isActive) ?? maps[0];
    const layout = Array.isArray(active?.layout)
      ? active.layout
      : trip.seatMapSnapshot;
    return parseSeatLayout(layout, trip.seatsTotal);
  })();
  const mine = new Set<string>(tickets.map((t) => t.seatLabel));
  const occupied = new Set<string>(
    ((trip as any)?.tickets ?? []).map((t: any) => String(t.seatLabel)),
  );

  const [pdfBusy, setPdfBusy] = useState(false);
  const [printBusy, setPrintBusy] = useState(false);
   const c = useColors();

  async function run(set: (b: boolean) => void, fn: () => Promise<void>) {
    set(true);
    try {
      await fn();
    } catch {
      // ignored — user can retry
    } finally {
      set(false);
    }
  }

  function pdfArgs() {
    return {
      reference: booking!.reference,
      status: booking!.status,
      coopName: trip?.coopName,
      coopLogoUrl: trip?.cooperative?.logoUrl,
      coopBrandColor: trip?.cooperative?.brandColor,
      originName: trip?.originName,
      destName: trip?.destName,
      departDate: trip?.departDate,
      departureAt: (trip?.departureAt ?? null) as number | string | null,
      totalAmount: booking!.totalAmount,
      currency: booking!.currency,
      tagName: (trip as any)?.tag?.name ?? null,
      tagColor: (trip as any)?.tag?.color ?? null,
      vehicleLabel: vehLabel,
      vehicleReg: vehReg,
      driverName: vehDriver,
      tickets: tickets.map((t) => ({
        seatLabel: t.seatLabel,
        passengerName: t.passengerName,
        qrToken: t.qrToken,
      })),
    };
  }

  return (
    <View className="flex-1 bg-sand" style={{ paddingTop: insets.top }}>
      {isLoading ? (
        <View className="w-full h-full items-center justify-center">
          <Spinner />
        </View>
      ) : !booking ? (
        <View className="flex-1 items-center justify-center p-8">
          <Text className="font-display text-xl text-ink">
            Réservation introuvable
          </Text>
          <Button
            variant="ink"
            className="mt-4"
            onPress={() => router.replace("/")}
          >
            <Text className="font-sans font-medium text-white">Accueil</Text>
          </Button>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: insets.bottom + 40,
          }}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            entering={ZoomIn.springify().damping(11).duration(500)}
            className="items-center"
          >
            <View className="flex flex-row justify-start w-full">
              <Pressable
                onPress={() => router.back()}
                className="h-9 w-9 items-center justify-center rounded-full bg-white/15"
              >
                <ChevronLeft size={30} color={c.ink} />
              </Pressable>
            </View>
            <CheckCircle2 size={56} color="#62b22e" />
            <Text className="mt-3 font-display text-2xl text-ink">
              Réservation confirmée
            </Text>
            <Text className="mt-1 font-mono text-sm text-ink-soft/90 font-bold">
              {booking.reference}
            </Text>
          </Animated.View>

          {/* Ticket — single card for the whole booking (image layout) */}
          <Animated.View
            entering={FadeInDown.delay(100).duration(420)}
            className="mt-6 relative"
          >
            {trip?.tag ? (
              <View className="absolute right-3 z-100" style={{ top: -8 }}>
                <TagBadge name={trip.tag.name} color={trip.tag.color} />
              </View>
            ) : null}
            <View className="overflow-hidden rounded-[16px] bg-paper">
              {/* Gold header: coop + logo */}
              <View className="flex-row items-center justify-between gap-3 bg-laterite px-5 py-3.5">
                <View className="flex-1 flex-row items-center gap-2.5">
                  <CoopLogo
                    url={trip?.cooperative?.logoUrl}
                    brandColor={trip?.cooperative?.brandColor}
                    name={trip?.coopName ?? ""}
                    size={30}
                  />
                  <Text
                    className="flex-1 font-display text-sm font-bold uppercase tracking-wide text-navy"
                    numberOfLines={1}
                  >
                    {trip?.coopName}
                  </Text>
                </View>
                <Text className="font-display text-lg font-bold uppercase tracking-[2px] text-navy">
                  Billet
                </Text>
              </View>

              {/* White body: route pins + date/time/seats/total grid */}
              <View className="px-5 py-5">
                <View className="flex-row gap-6">
                  <View className="relative flex-1 pl-6">
                    <View
                      className="absolute bottom-3 left-[7px] top-3 w-px"
                      style={{
                        borderLeftWidth: 2,
                        borderStyle: "dashed",
                        borderColor: "#14314C33",
                      }}
                    />
                    <View className="relative">
                      <MapPin
                        size={16}
                        color="#D9A441"
                        style={{ position: "absolute", left: -24, top: 1 }}
                      />
                      <Text className="font-mono text-[9px] uppercase tracking-widest text-ink-soft/60">
                        Départ
                      </Text>
                      <Text
                        className="font-display text-base font-bold uppercase text-ink"
                        numberOfLines={1}
                      >
                        {trip?.originName}
                      </Text>
                    </View>
                    <View className="relative mt-4">
                      <MapPin
                        size={16}
                        color="#D9A441"
                        style={{ position: "absolute", left: -24, top: 1 }}
                      />
                      <Text className="font-mono text-[9px] uppercase tracking-widest text-ink-soft/60">
                        Destination
                      </Text>
                      <Text
                        className="font-display text-base font-bold uppercase text-ink"
                        numberOfLines={1}
                      >
                        {trip?.destName}
                      </Text>
                    </View>
                  </View>

                  <View className="w-[104px] gap-3">
                    <TicketField
                      label="Date"
                      value={
                        trip?.departDate ? fmtDateKey(trip.departDate) : "—"
                      }
                    />
                    <TicketField
                      label="Heure"
                      value={fmtTime(trip?.departureAt)}
                    />
                  </View>
                </View>

                <View className="mt-5 flex-row gap-6">
                  <TicketField
                    className="flex-1"
                    label="Sièges"
                    value={tickets.map((t) => t.seatLabel).join(", ") || "—"}
                  />
                  <TicketField
                    className="flex-1"
                    label="Total"
                    value={fmtMoney(booking.totalAmount, booking.currency)}
                  />
                </View>

                {/* Secondary details */}
                <View
                  className="mt-5 flex-row flex-wrap gap-x-5 gap-y-3 pt-4"
                  style={{
                    borderTopWidth: 1,
                    borderStyle: "dashed",
                    borderColor: "#14314C26",
                  }}
                >
                  <TicketRow
                    label="Véhicule"
                    value={vehReg ? `${vehLabel} · ${vehReg}` : vehLabel}
                  />
                  {vehDriver ? (
                    <TicketRow label="Chauffeur" value={vehDriver} />
                  ) : null}
                  <TicketRow label="Passagers" value={String(tickets.length)} />
                  <View className="gap-1">
                    <Text className="font-mono text-[9px] uppercase tracking-widest text-ink-soft/60">
                      Statut
                    </Text>
                    <Badge {...bookingStatusFr(booking.status)} />
                  </View>
                </View>
              </View>

              {/* Perforation seam */}
              <View className="flex-row justify-center gap-2.5 bg-navy px-5">
                {Array.from({ length: 14 }, (_, i) => (
                  <View
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-sand"
                    style={{ marginTop: -6 }}
                  />
                ))}
              </View>

              {/* Navy stub: reference + QR */}
              <View className="items-center gap-3 bg-navy px-5 pb-6 pt-1">
                <View className="items-center">
                  <Text className="font-mono text-[9px] uppercase tracking-[3px] text-orange/70">
                    Référence
                  </Text>
                  <Text className="mt-0.5 font-display text-xl font-bold tracking-widest text-orange">
                    {booking.reference}
                  </Text>
                </View>
                <Text className="font-mono text-xs text-white/60">
                  {longDepart(trip?.departDate, trip?.departureAt)}
                </Text>
                <View className="rounded-[4px] bg-paper p-2">
                  <QRCode
                    value={tickets[0]?.qrToken ?? booking.reference}
                    size={104}
                    color="#14314C"
                    backgroundColor="#ffffff"
                  />
                </View>
              </View>
            </View>
          </Animated.View>

          {/* See seats in the vehicle */}
          {cells.length > 0 && (
            <Button
              variant="outline"
              className="mt-6"
              onPress={() => setSeatsOpen(true)}
            >
              <Armchair size={18} color="#D9A441" />
              <Text className="font-sans font-medium text-ink">
                Voir mes sièges dans le véhicule
              </Text>
            </Button>
          )}

          {/* Print / save */}
          <View className="mt-5 flex-row gap-2">
            <Button
              variant="outline"
              className="flex-1"
              loading={pdfBusy}
              onPress={() => run(setPdfBusy, () => shareTicketPdf(pdfArgs()))}
            >
              {!pdfBusy && <Download size={18} color="#14314C" />}
              <Text className="font-sans font-medium text-ink">
                Enregistrer PDF
              </Text>
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              loading={printBusy}
              onPress={() => run(setPrintBusy, () => printTicket(pdfArgs()))}
            >
              {!printBusy && <Printer size={18} color="#14314C" />}
              <Text className="font-sans font-medium text-ink">Imprimer</Text>
            </Button>
          </View>

          <View className="mt-5 gap-5">
            <Button
              variant="outline"
              onPress={() => router.replace("/bookings")}
            >
              <Text className="font-sans font-medium text-ink">
                Mes réservations
              </Text>
            </Button>
            <Button variant="outline" onPress={() => router.replace("/")}>
              Retour à l'accueil
            </Button>
          </View>
        </ScrollView>
      )}

      <Dialog open={seatsOpen} onOpenChange={setSeatsOpen}>
        <DialogContent className="gap-3">
          <DialogTitle className="font-display text-lg text-ink">
            Vos sièges
          </DialogTitle>
          <View className="items-center">
            <SeatMapView cells={cells} occupied={occupied} mine={mine} />
          </View>
        </DialogContent>
      </Dialog>
    </View>
  );
}

function TicketRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="gap-1">
      <Text className="font-mono text-[9px] uppercase tracking-widest text-ink-soft/60">
        {label}
      </Text>
      <Text className="font-sans text-sm font-bold text-ink">{value}</Text>
    </View>
  );
}

function TicketField({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <View className={className}>
      <Text className="font-mono text-[9px] uppercase tracking-widest text-ink-soft/60">
        {label}
      </Text>
      <Text
        className="mt-0.5 font-display text-base font-bold uppercase text-ink"
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

const JOURS = [
  "dimanche",
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
];
const MOIS = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

/** "jeudi 25 juin à 06:00" from a date-key + departure timestamp. */
function longDepart(
  departDate?: string,
  departureAt?: number | string | null,
): string {
  if (!departDate) return "";
  const d = new Date(`${departDate}T00:00:00`);
  const head = `${JOURS[d.getDay()]} ${d.getDate()} ${MOIS[d.getMonth()]}`;
  return departureAt ? `${head} à ${fmtTime(departureAt)}` : head;
}
