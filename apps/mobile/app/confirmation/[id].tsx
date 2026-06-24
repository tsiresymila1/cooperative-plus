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
  Ticket as TicketIcon,
} from "lucide-react-native";
import QRCode from "react-native-qrcode-svg";
import { Badge, Button, Card, Spinner } from "@/components/ui";
import { CoopLogo } from "@/components/coop-logo";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { SeatMapView } from "@/components/seat-map";
import { fmtMoney } from "@/lib/cn";
import { db } from "@/lib/db";
import { bookingStatusFr, fmtDateKey, fmtTime, parseSeatLayout } from "@/lib/domain";
import { printTicket, shareTicketPdf } from "@/lib/ticket-pdf";

export default function Confirmation() {
  const insets = useSafeAreaInsets();
  const { id: bookingId } = useLocalSearchParams<{ id: string }>();

  const { isLoading, data } = db.useQuery({
    bookings: {
      $: { where: { id: bookingId } },
      tickets: {},
      tripInstance: { cooperative: {}, vehicle: { seatMaps: {} }, tickets: {} },
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

          {/* Trip summary */}
          <Animated.View
            entering={FadeInDown.delay(100).duration(420)}
            className="mt-6"
          >
            <Card>
              <View className="flex-row items-center gap-2.5">
                <CoopLogo
                  url={trip?.cooperative?.logoUrl}
                  brandColor={trip?.cooperative?.brandColor}
                  name={trip?.coopName ?? ""}
                  size={36}
                />
                <View className="flex-1">
                  <Text
                    className="flex-1 font-sans text-sm font-bold text-laterite"
                    numberOfLines={1}
                  >
                    {trip?.coopName}
                  </Text>
                      <Text className="mt-1 font-mono text-sm text-ink-soft/90 font-bold">
                    {booking.reference}
                  </Text>
                </View>
                <Badge {...bookingStatusFr(booking.status)} />
              </View>
              <View className="mt-3 flex-row items-center gap-2">
                <Text className="font-display text-xl text-ink">
                  {trip?.originName}
                </Text>
                <Text className="text-laterite">→</Text>
                <Text className="font-display text-xl text-laterite">
                  {trip?.destName}
                </Text>
              </View>
              <View className="mt-3 flex-row items-center justify-between">
                <Text className="font-mono text-sm text-ink-soft">
                  {trip
                    ? `${fmtDateKey(trip.departDate)} · ${fmtTime(trip.departureAt)}`
                    : ""}
                </Text>
                <Text className="font-mono text-base text-ink">
                  {fmtMoney(booking.totalAmount, booking.currency)}
                </Text>
              </View>
            </Card>
          </Animated.View>

          {/* Tickets with QR */}
          <Animated.View entering={FadeInDown.delay(180).duration(420)}>
            <Text className="mb-2 mt-6 font-display text-lg text-ink">
              {tickets.length > 1 ? "Vos billets" : "Votre billet"}
            </Text>
          </Animated.View>
          {tickets.map((tk, i) => (
            <Animated.View
              key={tk.id}
              entering={FadeInDown.delay(180 + i * 90).duration(420)}
            >
              <Card className="mb-3 flex-row items-center gap-4">
                <View className="rounded-[4px] bg-paper p-2">
                  <QRCode
                    value={tk.qrToken}
                    size={84}
                    color="#16266b"
                    backgroundColor="#ffffff"
                  />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center gap-1.5">
                    <TicketIcon size={14} color="#f5821f" />
                    <Text className="font-display text-base text-ink">
                      Siège {tk.seatLabel}
                    </Text>
                  </View>
                  <Text className="mt-1 font-sans text-sm text-ink-soft">
                    {tk.passengerName}
                  </Text>
                  <Text className="mt-1 font-mono text-xs text-ink-soft/60">
                    {tk.qrToken.slice(0, 12)}…
                  </Text>
                </View>
              </Card>
            </Animated.View>
          ))}

          {/* See seats in the vehicle */}
          {cells.length > 0 && (
            <Button variant="outline" className="mt-5" onPress={() => setSeatsOpen(true)}>
              <Armchair size={18} color="#ff7a00" />
              <Text className="font-sans font-medium text-ink">Voir mes sièges dans le véhicule</Text>
            </Button>
          )}

          {/* Print / save */}
          <View className="mt-2 flex-row gap-2">
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

          <View className="mt-2 gap-2">
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
