import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { router } from "expo-router";
import { Check, ChevronLeft, CreditCard, Smartphone, Wallet } from "lucide-react-native";
import { Button, Card, Field, Input } from "@/components/ui";
import { CoopLogo } from "@/components/coop-logo";
import { MessageDialog, type Notice } from "@/components/ui/message-dialog";
import { useColors } from "@/lib/colors";
import { cn, fmtMoney } from "@/lib/cn";
import { db, id, type Chunk } from "@/lib/db";
import { useAuth } from "@/lib/auth";
import { useSelection } from "@/lib/selection";
import { fmtCountdown, makeQrToken, makeReference } from "@/lib/domain";

type MethodMeta = { label: string; desc: string; Icon: typeof Smartphone; provider: string };

// Known methods get rich meta; custom coop methods fall back to a generic tile.
const METHOD_META: Record<string, MethodMeta> = {
  mobile_money: { label: "Mobile Money", desc: "MVola · Orange Money · Airtel", Icon: Smartphone, provider: "mvola" },
  card: { label: "Carte bancaire", desc: "Visa · Mastercard", Icon: CreditCard, provider: "stripe" },
  cash: { label: "Espèces", desc: "Payez au chauffeur, à bord", Icon: Wallet, provider: "cash" },
};

function metaFor(key: string): MethodMeta {
  return (
    METHOD_META[key] ?? {
      label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " "),
      desc: "Paiement auprès de la coopérative",
      Icon: Wallet,
      provider: key,
    }
  );
}

export default function Checkout() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { selection, setSelection } = useSelection();
  const c = useColors();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState(user?.email ?? "");
  const [method, setMethod] = useState<string>("mobile_money");
  // Init from the real hold so the countdown never starts at 0 (which used to
  // trigger a false "expired" alert on the first render).
  const [remaining, setRemaining] = useState(() =>
    selection ? Math.max(0, selection.holdExpiresAt - Date.now()) : 0,
  );
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const expiredRef = useRef(false);
  const completedRef = useRef(false);
  const prefilledRef = useRef(false);

  // Trip context for the summary (coop logo + occupancy + accepted payments).
  const { data: tripData } = db.useQuery(
    selection ? { tripInstances: { $: { where: { id: selection.tripInstanceId } }, cooperative: {}, tickets: {} } } : null,
  );
  const summaryTrip = tripData?.tripInstances?.[0];

  // Logged-in user's profile → prefill the passenger fields once.
  const { data: profileData } = db.useQuery(user?.id ? { $users: { $: { where: { id: user.id } } } } : null);
  const profile = profileData?.$users?.[0];
  useEffect(() => {
    if (!profile || prefilledRef.current) return;
    prefilledRef.current = true;
    if (profile.name) setName(profile.name);
    if (profile.phone) setPhone(profile.phone);
    if (profile.email) setEmail(profile.email);
  }, [profile]);

  // Payment methods accepted by the cooperative (incl. custom keys); fallback to all.
  const accepted: string[] =
    Array.isArray(summaryTrip?.cooperative?.paymentMethods) && (summaryTrip!.cooperative!.paymentMethods as string[]).length
      ? (summaryTrip!.cooperative!.paymentMethods as string[])
      : ["mobile_money", "card", "cash"];
  const methods = accepted.map((key) => ({ key, ...metaFor(key) }));
  useEffect(() => {
    if (methods.length && !accepted.includes(method)) setMethod(methods[0]!.key);
  }, [accepted.join(",")]);

  // Release the server-side seat holds (so the seats free up immediately).
  function releaseHolds() {
    if (!selection) return;
    db.transact(selection.seats.map((s) => db.tx.seatHolds[s.holdId]!.delete())).catch(() => {});
  }

  // Hold countdown.
  useEffect(() => {
    if (!selection) return;
    const tick = () => setRemaining(Math.max(0, selection.holdExpiresAt - Date.now()));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [selection]);

  // When the hold genuinely expires, free the seats and send the user back.
  useEffect(() => {
    if (!selection || expiredRef.current || remaining > 0) return;
    expiredRef.current = true;
    releaseHolds();
    setNotice({
      title: "Réservation expirée",
      message: "Le délai de 5 minutes est écoulé. Resélectionnez vos sièges.",
      onClose: () => {
        setSelection(null);
        router.replace("/");
      },
    });
  }, [remaining, selection]);

  // If the user abandons checkout (unmount without completing), free the seats.
  useEffect(() => {
    return () => {
      if (!completedRef.current && !expiredRef.current) releaseHolds();
    };
  }, [selection]);

  function leave() {
    releaseHolds();
    completedRef.current = true; // unmount cleanup must not double-release
    setSelection(null);
    router.back();
  }

  if (!selection) {
    return (
      <View className="flex-1 items-center justify-center bg-sand p-8" style={{ paddingTop: insets.top }}>
        <Text className="font-display text-xl text-ink">Aucune sélection en cours</Text>
        <Button className="mt-4" onPress={() => router.replace("/")}>
          <Text className="font-sans font-medium text-paper">Retour à la recherche</Text>
        </Button>
      </View>
    );
  }

  const seatCount = selection.seats.length;
  const total = selection.price * seatCount;
  const canSubmit = name.trim().length > 1 && phone.trim().length >= 6 && !submitting;

  async function confirm() {
    if (!selection || !canSubmit) return;
    setSubmitting(true);

    const bookingId = id();
    const paymentId = id();
    const reference = makeReference();
    const now = Date.now();
    const isCash = method === "cash";
    const chosen = metaFor(method);

    try {
      // Booking (+ customer / cooperative links).
      let booking = db.tx.bookings[bookingId]!
        .update({
          reference,
          source: "mobile",
          contactName: name.trim(),
          contactPhone: phone.trim(),
          contactEmail: email.trim() || undefined,
          seatCount,
          totalAmount: total,
          currency: selection.currency,
          status: isCash ? "pending" : "confirmed",
          createdAt: now,
        })
        .link({ tripInstance: selection.tripInstanceId });
      if (user?.id) booking = booking.link({ customer: user.id });
      if (selection.cooperativeId) booking = booking.link({ cooperative: selection.cooperativeId });

      // Payment.
      let payment = db.tx.payments[paymentId]!
        .update({
          method,
          provider: chosen.provider,
          amount: total,
          currency: selection.currency,
          status: isCash ? "pending" : "paid",
          paidAt: isCash ? undefined : now,
          createdAt: now,
        })
        .link({ booking: bookingId });
      if (selection.cooperativeId) payment = payment.link({ cooperative: selection.cooperativeId });

      // One atomic transaction: booking + payment + tickets (unique seatKey =
      // hard overbooking guard) + hold cleanup. We do NOT touch tripInstances:
      // riders lack update perms on it, and tickets are the source of truth for
      // occupancy (availability is derived from the ticket count).
      const chunks: Chunk[] = [booking, payment];

      // Tickets — one per held seat, each with a unique seatKey + qrToken.
      for (const seat of selection.seats) {
        const ticketId = id();
        let t = db.tx.tickets[ticketId]!
          .update({
            seatKey: seat.seatKey,
            seatLabel: seat.seatLabel,
            passengerName: name.trim(),
            passengerPhone: phone.trim() || undefined,
            price: selection.price,
            qrToken: makeQrToken(),
            createdAt: now,
          })
          .link({ booking: bookingId, tripInstance: selection.tripInstanceId });
        if (selection.cooperativeId) t = t.link({ cooperative: selection.cooperativeId });
        chunks.push(t);
      }

      // Drop the now-consumed holds.
      for (const seat of selection.seats) {
        chunks.push(db.tx.seatHolds[seat.holdId]!.delete());
      }

      await db.transact(chunks);

      completedRef.current = true; // holds already consumed by the transaction
      setSelection(null);
      router.replace({ pathname: "/confirmation/[id]", params: { id: bookingId } });
    } catch (e) {
      console.warn("[checkout] booking failed:", e);
      setNotice({
        title: "Échec de la réservation",
        message: "Impossible de finaliser pour le moment. Réessayez.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const expiring = remaining < 60_000;

  return (
    <View className="flex-1 bg-sand" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center justify-between px-5 py-3">
        <View className="flex-row items-center gap-3">
          <Pressable onPress={leave} className="h-9 w-9 items-center justify-center rounded-[4px] border border-ink/10 bg-paper">
            <ChevronLeft size={20} color={c.ink} />
          </Pressable>
          <Text className="font-display text-lg text-ink">Paiement</Text>
        </View>
        <View className={cn("rounded-[4px] px-3 py-1", expiring ? "bg-laterite/15" : "bg-baobab/15")}>
          <Text className={cn("font-mono text-sm", expiring ? "text-laterite-deep" : "text-baobab")}>
            {fmtCountdown(Math.max(0, remaining))}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 160 }} showsVerticalScrollIndicator={false}>
        {/* Summary */}
        <Animated.View entering={FadeInDown.duration(420)}>
          <Card>
            <View className="flex-row items-center gap-2.5">
              <CoopLogo
                url={summaryTrip?.cooperative?.logoUrl}
                brandColor={summaryTrip?.cooperative?.brandColor}
                name={selection.coopName}
                size={38}
              />
              <View className="flex-1">
                <Text className="font-sans text-sm font-semibold text-laterite" numberOfLines={1}>{selection.coopName}</Text>
                {summaryTrip ? (
                  <Text className="font-mono text-[11px] text-ink-soft/60">
                    {summaryTrip.tickets?.length ?? 0}/{summaryTrip.seatsTotal} places occupées
                  </Text>
                ) : null}
              </View>
            </View>
            <View className="mt-3 flex-row items-center gap-2">
              <Text className="font-display text-xl text-ink">{selection.originName}</Text>
              <Text className="text-laterite">→</Text>
              <Text className="font-display text-xl text-laterite">{selection.destName}</Text>
            </View>
            <View className="mt-3 flex-row items-center justify-between">
              <Text className="font-sans text-sm text-ink-soft">
                Sièges {selection.seats.map((s) => s.seatLabel).join(", ")}
              </Text>
              <Text className="font-mono text-base text-ink">
                {seatCount} × {fmtMoney(selection.price, selection.currency)}
              </Text>
            </View>
          </Card>
        </Animated.View>

        {/* Passenger info */}
        <Animated.View entering={FadeInDown.delay(80).duration(420)} className="mt-5">
          <Text className="mb-2 font-display text-lg text-ink">Passager principal</Text>
          <Card className="gap-3">
            <Field label="Nom complet">
              <Input value={name} onChangeText={setName} placeholder="Rakoto Jean" autoCapitalize="words" />
            </Field>
            <View className="h-px bg-ink/8" />
            <Field label="Téléphone">
              <Input value={phone} onChangeText={setPhone} placeholder="034 12 345 67" keyboardType="phone-pad" />
            </Field>
            <View className="h-px bg-ink/8" />
            <Field label="Email (optionnel)">
              <Input value={email} onChangeText={setEmail} placeholder="vous@exemple.mg" keyboardType="email-address" autoCapitalize="none" />
            </Field>
          </Card>
        </Animated.View>

        {/* Payment method */}
        <Animated.View entering={FadeInDown.delay(160).duration(420)} className="mt-5">
          <Text className="mb-2 font-display text-lg text-ink">Mode de paiement</Text>
          <View className="gap-2">
            {methods.map((m) => {
              const active = method === m.key;
              return (
                <Pressable
                  key={m.key}
                  onPress={() => setMethod(m.key)}
                  className={cn(
                    "flex-row items-center gap-3 rounded-[4px] border bg-paper p-3.5 active:opacity-90",
                    active ? "border-laterite bg-laterite/5" : "border-ink/10",
                  )}
                >
                  <View className={cn("h-11 w-11 items-center justify-center rounded-[4px]", active ? "bg-laterite" : "bg-sand")}>
                    <m.Icon size={20} color={active ? "#ffffff" : "#16266b"} />
                  </View>
                  <View className="flex-1">
                    <Text className="font-sans text-base font-medium text-ink">{m.label}</Text>
                    <Text className="font-mono text-[11px] text-ink-soft/60">{m.desc}</Text>
                  </View>
                  <View
                    className={cn(
                      "h-6 w-6 items-center justify-center rounded-full border-2",
                      active ? "border-laterite bg-laterite" : "border-ink/20",
                    )}
                  >
                    {active ? <Check size={14} color="#ffffff" /> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      </ScrollView>

      <View className="absolute inset-x-0 bottom-0 border-t border-ink/10 bg-paper px-5 pt-3" style={{ paddingBottom: insets.bottom + 12 }}>
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="font-sans font-bold text-sm text-ink-soft">Total</Text>
          <Text className="font-mono  font-bold text-xl text-ink">{fmtMoney(total, selection.currency)}</Text>
        </View>
        <Button onPress={confirm} loading={submitting} disabled={!canSubmit}>
          <Text className="font-sans font-medium text-white">
            {method === "cash" ? "Réserver (payer à bord)" : "Payer maintenant"}
          </Text>
        </Button>
      </View>

      <MessageDialog notice={notice} onDismiss={() => setNotice(null)} />
    </View>
  );
}
