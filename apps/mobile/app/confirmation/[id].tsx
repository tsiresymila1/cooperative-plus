import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { router, useLocalSearchParams } from "expo-router";
import {
  Armchair,
  CheckCircle2,
  Download,
  Printer,
} from "lucide-react-native";
import QRCode from "react-native-qrcode-svg";
import { Badge, Button, Spinner } from "@/components/ui";
import { CoopLogo } from "@/components/coop-logo";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { SeatMapView } from "@/components/seat-map";
import { fmtMoney } from "@/lib/cn";
import { db } from "@/lib/db";
import { bookingStatusFr, fmtTime, parseSeatLayout } from "@/lib/domain";
import { printTicket, shareTicketPdf } from "@/lib/ticket-pdf";
import { TagBadge } from "@/components/tag-badge";

export default function Confirmation() {
  const insets = useSafeAreaInsets();
  const { id: bookingId } = useLocalSearchParams<{ id: string }>();

  const { isLoading, data } = db.useQuery({
    bookings: {
      $: { where: { id: bookingId } },
      tickets: {},
      tripInstance: { cooperative: {}, vehicle: { seatMaps: {} }, tickets: {}, tag: {} },
    },
  });

  const booking = data?.bookings?.[0];
  const trip = booking?.tripInstance;
  const tickets = booking?.tickets ?? [];

  const [seatsOpen, setSeatsOpen] = useState(false);
  // Seat map cells = vehicle active map (fallback to snapshot), like the booking page.
  const cells = (() => {
    if (!trip) return [];
    const maps = (trip as any).vehicle?.seatMaps ?? [];
    const active = maps.find((m: any) => m.isActive) ?? maps[0];
    const layout = Array.isArray(active?.layout) ? active.layout : trip.seatMapSnapshot;
    return parseSeatLayout(layout, trip.seatsTotal);
  })();
  const mine = new Set<string>(tickets.map((t) => t.seatLabel));
  const occupied = new Set<string>(((trip as any)?.tickets ?? []).map((t: any) => String(t.seatLabel)));

  const [pdfBusy, setPdfBusy] = useState(false);
  const [printBusy, setPrintBusy] = useState(false);

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
          <Button className="mt-4" onPress={() => router.replace("/")}>
            <Text className="font-sans font-medium text-paper">Accueil</Text>
          </Button>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{
            padding: 20,
            paddingBottom: insets.bottom + 40,
          }}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            entering={FadeIn.duration(400)}
            className="items-center pt-6"
          >
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
            <View className="overflow-hidden rounded-[16px] border-0 border-ink/8 bg-paper">

              {/* Navy header: coop + reference, then route + date */}
              <View className="bg-navy-deep px-5 pb-6 pt-5">
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 flex-row items-center gap-2.5">
                    <CoopLogo
                      url={trip?.cooperative?.logoUrl}
                      brandColor={trip?.cooperative?.brandColor}
                      name={trip?.coopName ?? ""}
                      size={32}
                    />
                    <Text className="flex-1 font-sans text-sm font-bold text-white" numberOfLines={1}>
                      {trip?.coopName}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="font-mono text-[10px] uppercase tracking-widest text-white/45">
                      Référence
                    </Text>
                    <Text className="mt-0.5 font-mono text-sm font-bold text-orange">
                      {booking.reference}
                    </Text>
                  </View>
                </View>
                <Text className="mt-4 font-display text-2xl text-white">
                  {trip?.originName} → {trip?.destName}
                </Text>
                <Text className="mt-1.5 font-mono text-sm text-white/70">
                  {longDepart(trip?.departDate, trip?.departureAt)}
                </Text>
              </View>

              {/* Notch seam */}
              <View className="relative h-0">
                <View className="absolute -left-2.5 -top-2.5 h-5 w-5 rounded-full bg-sand" />
                <View className="absolute -right-2.5 -top-2.5 h-5 w-5 rounded-full bg-sand" />
              </View>

              {/* White body: single QR + summary rows */}
              <View className="flex-row items-center gap-5 px-5 py-6">
                <View className="rounded-[4px] bg-paper">
                  <QRCode
                    value={tickets[0]?.qrToken ?? booking.reference}
                    size={100}
                    color="#16266b"
                    backgroundColor="#ffffff"
                  />
                </View>
                <View className="flex-1 gap-2">
                  <TicketRow label="Sièges" value={tickets.map((t) => t.seatLabel).join(", ") || "—"} />
                  <TicketRow label="Passagers" value={String(tickets.length)} />
                  <TicketRow label="Total" value={fmtMoney(booking.totalAmount, booking.currency)} />
                  <View className="flex-row items-center justify-between">
                    <Text className="font-sans text-sm text-ink-soft">Statut</Text>
                    <Badge {...bookingStatusFr(booking.status)} />
                  </View>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* See seats in the vehicle */}
          {cells.length > 0 && (
            <Button variant="outline" className="mt-6" onPress={() => setSeatsOpen(true)}>
              <Armchair size={18} color="#ff7a00" />
              <Text className="font-sans font-medium text-ink">Voir mes sièges dans le véhicule</Text>
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
              {!pdfBusy && <Download size={18} color="#16266b" />}
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
              {!printBusy && <Printer size={18} color="#16266b" />}
              <Text className="font-sans font-medium text-ink">Imprimer</Text>
            </Button>
          </View>

          <View className="mt-5 gap-5">
            <Button onPress={() => router.replace("/bookings")}>
              <Text className="font-sans font-medium text-white">
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
          <DialogTitle className="font-display text-lg text-ink">Vos sièges</DialogTitle>
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
    <View className="flex-row items-center justify-between">
      <Text className="font-sans text-sm text-ink-soft">{label}</Text>
      <Text className="font-sans text-sm font-bold text-ink">{value}</Text>
    </View>
  );
}

const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

/** "jeudi 25 juin à 06:00" from a date-key + departure timestamp. */
function longDepart(departDate?: string, departureAt?: number | string | null): string {
  if (!departDate) return "";
  const d = new Date(`${departDate}T00:00:00`);
  const head = `${JOURS[d.getDay()]} ${d.getDate()} ${MOIS[d.getMonth()]}`;
  return departureAt ? `${head} à ${fmtTime(departureAt)}` : head;
}
