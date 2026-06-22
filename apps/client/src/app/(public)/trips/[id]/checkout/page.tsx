"use client";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Banknote, CreditCard, Smartphone, Lock } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Button, Card } from "@cp/ui";
import { Field, Input } from "@cp/ui";
import { toast } from "@cp/ui";
import { db, id } from "@cp/ui";
import { useBookingDraft } from "@/lib/booking-store";
import { cn, fmtMoney } from "@cp/ui";

const methodLabel = (m: string) =>
  (({ cash: "Espèces", mobile_money: "Mobile Money", card: "Carte" }) as Record<string, string>)[m] ??
  m.charAt(0).toUpperCase() + m.slice(1);

const METHOD_META: Record<string, { provider: string; desc: string; icon: typeof Smartphone }> = {
  mobile_money: { provider: "mvola", desc: "MVola · Orange · Airtel", icon: Smartphone },
  card: { provider: "stripe", desc: "Visa · Mastercard", icon: CreditCard },
  cash: { provider: "manual", desc: "Payer avant le départ", icon: Banknote },
};

const buildMethods = (accepted: string[]) =>
  accepted.map((id) => {
    const meta = METHOD_META[id] ?? { provider: "manual", desc: "", icon: Banknote };
    return { id, provider: meta.provider, label: methodLabel(id), desc: meta.desc, icon: meta.icon };
  });

const ref = () => "CP-" + Math.random().toString(36).slice(2, 8).toUpperCase();

export default function Checkout({ params }: { params: Promise<{ id: string }> }) {
  const { id: instanceId } = use(params);
  const router = useRouter();
  const { user } = db.useAuth();
  const draft = useBookingDraft();
  const [method, setMethod] = useState<string>("");
  const [contact, setContact] = useState({ name: "", phone: "", email: "" });
  const [passengers, setPassengers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const { data } = db.useQuery({
    tripInstances: { $: { where: { id: instanceId } }, cooperative: {} },
  });
  const trip = data?.tripInstances?.[0];
  const accepted: string[] =
    Array.isArray(trip?.cooperative?.paymentMethods) && trip.cooperative.paymentMethods.length
      ? (trip.cooperative.paymentMethods as string[])
      : ["cash", "mobile_money", "card"];
  const methods = buildMethods(accepted);

  // Default the selected method to the first accepted one once known, and
  // reset if the current selection is no longer offered.
  useEffect(() => {
    if (!accepted.length) return;
    if (!method || !accepted.includes(method)) setMethod(accepted[0]);
  }, [accepted.join(","), method]);

  const seats = [...draft.seats].sort();

  if (!seats.length) {
    return (<><SiteHeader /><main className="mx-auto max-w-3xl px-5 py-20 text-center">
      <p className="text-ink-soft">Aucun siège sélectionné.</p>
      <Button className="mt-4" onClick={() => router.push(`/trips/${instanceId}`)}>Choisir un siège</Button>
    </main></>);
  }

  const total = (trip?.price ?? draft.price) * seats.length;
  const m = methods.find((x) => x.id === method) ?? methods[0];

  const pay = async () => {
    if (!trip) return;
    setLoading(true);
    const reference = ref();
    const bookingId = id();
    const paid = method !== "cash";
    try {
      await db.transact([
        db.tx.bookings[bookingId].update({
          reference, source: "customer", contactName: contact.name, contactPhone: contact.phone,
          contactEmail: contact.email || undefined, seatCount: seats.length, totalAmount: total,
          currency: trip.currency, status: paid ? "confirmed" : "pending", createdAt: Date.now(),
        }).link({ cooperative: draft.coopId ?? undefined, tripInstance: instanceId, customer: user?.id }),
        ...seats.map((label) =>
          db.tx.tickets[id()].update({
            seatKey: `${instanceId}_${label}`, seatLabel: label,
            passengerName: passengers[label] || contact.name, price: trip.price,
            qrToken: id(), createdAt: Date.now(),
          }).link({ booking: bookingId, cooperative: draft.coopId ?? undefined, tripInstance: instanceId })),
        db.tx.payments[id()].update({
          method: m.id, provider: m.provider, amount: total, currency: trip.currency,
          status: paid ? "paid" : "pending", paidAt: paid ? Date.now() : undefined, createdAt: Date.now(),
        }).link({ cooperative: draft.coopId ?? undefined, booking: bookingId }),
        // NOTE: seatsBooked counter NOT updated here — customers can't write tripInstances
        // (perms). Availability is derived from tickets + active holds everywhere.
        ...Object.values(draft.holds).map((hid) => db.tx.seatHolds[hid].delete()),
      ]);
      draft.reset();
      toast.success(paid ? "Paiement confirmé · billet émis" : "Réservation enregistrée");
      router.push(`/bookings/${reference}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Échec de la réservation");
      setLoading(false);
    }
  };

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-5 py-8">
        <h1 className="mb-6 font-display text-3xl font-bold">Finaliser la réservation</h1>
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="mb-4 font-display text-lg font-bold">Contact</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Nom"><Input value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} required /></Field>
                <Field label="Téléphone"><Input inputMode="tel" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} required /></Field>
                <Field label="Email (optionnel)" className="sm:col-span-2"><Input type="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} /></Field>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="mb-4 font-display text-lg font-bold">Passagers</h2>
              <div className="space-y-3">
                {seats.map((s) => (
                  <div key={s} className="grid grid-cols-[64px_1fr] gap-3">
                    <div className="flex h-11 items-center justify-center rounded-[--radius] bg-orange/10 font-mono font-bold text-orange-deep">{s}</div>
                    <Field><Input placeholder={`Nom passager siège ${s}`} value={passengers[s] ?? ""} onChange={(e) => setPassengers({ ...passengers, [s]: e.target.value })} /></Field>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="mb-4 font-display text-lg font-bold">Paiement</h2>
              <div className="grid gap-3 sm:grid-cols-3">
                {methods.map((mm) => {
                  const Icon = mm.icon; const active = method === mm.id;
                  return (
                    <button key={mm.id} onClick={() => setMethod(mm.id)}
                      className={cn("rounded-[--radius] border p-4 text-left transition-all", active ? "border-orange bg-orange/5 ring-2 ring-orange/20" : "border-ink/12 hover:border-ink/25")}>
                      <Icon size={20} className={active ? "text-orange" : "text-ink-soft"} />
                      <p className="mt-2 font-semibold text-ink">{mm.label}</p>
                      <p className="text-xs text-ink-soft">{mm.desc}</p>
                    </button>
                  );
                })}
              </div>
              {method === "mobile_money" && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-4">
                  <Field label="Numéro Mobile Money"><Input placeholder="034 00 000 00" inputMode="tel" /></Field>
                </motion.div>
              )}
            </Card>
          </div>

          <div className="lg:sticky lg:top-20 lg:self-start">
            <Card className="p-5">
              <h3 className="font-display text-lg font-bold">{draft.origin} → {draft.dest}</h3>
              <p className="text-sm text-ink-soft">{new Date(draft.departureAt).toLocaleString("fr", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-ink-soft">{seats.length} × {fmtMoney(trip?.price ?? draft.price)}</span><span className="font-medium">{fmtMoney(total)}</span></div>
                <div className="flex justify-between"><span className="text-ink-soft">Sièges</span><span className="font-mono font-medium">{seats.join(", ")}</span></div>
              </div>
              <div className="mt-4 flex items-end justify-between border-t border-ink/8 pt-4">
                <span className="text-sm text-ink-soft">Total</span><span className="font-mono text-2xl font-bold">{fmtMoney(total)}</span>
              </div>
              <Button className="mt-4 w-full" disabled={loading || !contact.name || !contact.phone} onClick={pay}>
                {loading ? "Traitement…" : method === "cash" ? "Réserver (payer à la gare)" : `Payer ${fmtMoney(total)}`}
              </Button>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-ink-soft/70"><Lock size={13} /> Paiement sécurisé</p>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}
