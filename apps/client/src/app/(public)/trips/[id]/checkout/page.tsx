"use client";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Banknote, CreditCard, Smartphone, Lock } from "lucide-react";
import { slotSeatKey, isValidPhone } from "@cp/ui";
import { toast } from "@cp/ui";
import { db, id } from "@cp/ui";
import { useBookingDraft } from "@/lib/booking-store";
import { cn, fmtMoney } from "@cp/ui";

const methodLabel = (m: string) =>
  (({ cash: "Espèces", mobile_money: "Mobile Money", card: "Carte" }) as Record<string, string>)[m] ??
  m.charAt(0).toUpperCase() + m.slice(1);

const METHOD_META: Record<string, { provider: string; desc: string; icon: typeof Smartphone }> = {
  mobile_money: { provider: "mvola", desc: "MVola · Orange Money · Airtel Money", icon: Smartphone },
  card: { provider: "stripe", desc: "Visa · Mastercard", icon: CreditCard },
  cash: { provider: "manual", desc: "Payer avant le départ", icon: Banknote },
};

const buildMethods = (accepted: string[]) =>
  accepted.map((id) => {
    const meta = METHOD_META[id] ?? { provider: "manual", desc: "", icon: Banknote };
    return { id, provider: meta.provider, label: methodLabel(id), desc: meta.desc, icon: meta.icon };
  });

const ref = () => "CP-" + Math.random().toString(36).slice(2, 8).toUpperCase();

const btnGold =
  "inline-flex h-14 w-full items-center justify-center gap-2 px-6 font-display text-[15px] font-semibold uppercase tracking-[0.5px] transition-colors duration-200 bg-gold text-navy hover:bg-navy hover:text-white disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-gold disabled:hover:text-navy";
const fieldCls =
  "h-12 w-full border border-navy/15 bg-white px-4 font-body text-[15px] text-navy outline-none transition-colors placeholder:text-navy/30 focus:border-gold";
const labelCls =
  "mb-2 block font-body text-[11px] font-semibold uppercase tracking-[1.5px] text-navy/50";

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
  const { data: meData } = db.useQuery(user?.id ? { $users: { $: { where: { id: user.id } } } } : null);
  const me = meData?.$users?.[0];
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

  // Prefill contact from the signed-in client (only empty fields).
  useEffect(() => {
    if (!user) return;
    setContact((c) => ({
      name: c.name || (me?.name as string) || "",
      phone: c.phone || (me?.phone as string) || "",
      email: c.email || user.email || "",
    }));
  }, [me?.id, user?.email]);

  // Default each passenger to the client's name (editable).
  useEffect(() => {
    const nm = (me?.name as string) || "";
    if (!nm) return;
    setPassengers((p) => {
      let changed = false;
      const next = { ...p };
      for (const s of seats) if (!next[s]) { next[s] = nm; changed = true; }
      return changed ? next : p;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me?.id, seats.join(",")]);

  if (!seats.length) {
    return (
      <main className="pt-[100px]">
        <div className="mx-auto max-w-content px-[15px] py-24 text-center">
          <p className="font-body text-navy/60">Aucun siège sélectionné.</p>
          <button className={`mx-auto mt-6 max-w-xs ${btnGold}`} onClick={() => router.push(`/trips/${instanceId}`)}>
            Choisir un siège
          </button>
        </div>
      </main>
    );
  }

  const total = (trip?.price ?? draft.price) * seats.length;
  const m = methods.find((x) => x.id === method) ?? methods[0];

  const pay = async () => {
    if (!trip) return;
    if (!isValidPhone(contact.phone)) { toast.error("Numéro de téléphone invalide"); return; }
    setLoading(true);
    const reference = ref();
    const bookingId = id();
    const isOnline = method === "mobile_money";
    // PAPI validDuration = 30 min — holds stay active until payment confirmed or expired
    const holdExpiresAt = Date.now() + 30 * 60 * 1000;
    const holdIds = Object.values(draft.holds);
    const coopId = draft.coopId;
    // Seat/passenger info passed to initiate API → stored in payment.meta for webhook
    const seatMeta = seats.map((label) => ({
      label,
      passengerName: passengers[label] || contact.name,
      price: trip.price,
    }));
    try {
      await db.transact([
        db.tx.bookings[bookingId].update({
          reference, source: "customer", contactName: contact.name, contactPhone: contact.phone,
          contactEmail: contact.email || undefined, seatCount: seats.length, totalAmount: total,
          currency: trip.currency, status: "pending", createdAt: Date.now(),
          ...(isOnline ? { holdExpiresAt } : {}),
        }).link({ cooperative: draft.coopId ?? undefined, tripInstance: instanceId, customer: user?.id }),
        // Online: extend holds to match payment window — seats blocked until paid or expired.
        // Cash: create tickets + delete holds immediately.
        ...(!isOnline ? [
          ...seats.map((label) =>
            db.tx.tickets[id()].update({
              seatKey: slotSeatKey(draft.slotId ?? instanceId, label), seatLabel: label,
              passengerName: passengers[label] || contact.name, price: trip.price,
              qrToken: id(), createdAt: Date.now(),
            }).link({ booking: bookingId, cooperative: draft.coopId ?? undefined, tripInstance: instanceId, ...(draft.slotIsVirtual || !draft.slotId ? {} : { tripVehicle: draft.slotId }) })),
          ...holdIds.map((hid) => db.tx.seatHolds[hid].delete()),
        ] : [
          ...holdIds.map((hid) => db.tx.seatHolds[hid].update({ expiresAt: holdExpiresAt })),
        ]),
      ]);
      if (isOnline) {
        const res = await fetch("/api/payment/initiate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingReference: reference, seatMeta, holdIds, instanceId, coopId, tripVehicleId: draft.slotIsVirtual ? null : draft.slotId }),
        });
        const data = await res.json();
        if (!res.ok) {
          draft.reset();
          toast.error(data.error ?? "Erreur paiement en ligne");
          router.push(`/bookings/${reference}`);
          return;
        }
        // Don't reset draft before redirect — would flash "Aucun siège" during navigation.
        // Draft clears naturally when user leaves the page.
        window.location.href = data.url;
      } else {
        draft.reset();
        toast.success("Réservation enregistrée · payez à la gare");
        router.push(`/bookings/${reference}`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Échec de la réservation");
      setLoading(false);
    }
  };

  return (
    <main className="pt-[100px]">
      <div className="mx-auto max-w-content px-[15px] py-10 lg:py-14">
        <p className="font-body text-[11px] font-semibold uppercase tracking-[3px] text-gold">
          Réservation
        </p>
        <h1 className="mb-8 mt-2 font-display text-[38px] font-semibold uppercase leading-none tracking-[-1px] text-navy lg:text-[52px]">
          Finaliser la réservation
        </h1>
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <div className="border border-navy/10 bg-white p-6">
              <h2 className="mb-5 font-display text-2xl font-semibold uppercase tracking-[-0.5px] text-navy">Contact</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className={labelCls}>Nom</span>
                  <input className={fieldCls} value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} required />
                </label>
                <label className="block">
                  <span className={labelCls}>Téléphone</span>
                  <input className={fieldCls} inputMode="tel" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} required />
                </label>
                <label className="block sm:col-span-2">
                  <span className={labelCls}>Email (optionnel)</span>
                  <input className={fieldCls} type="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} />
                </label>
              </div>
            </div>

            <div className="border border-navy/10 bg-white p-6">
              <h2 className="mb-5 font-display text-2xl font-semibold uppercase tracking-[-0.5px] text-navy">Passagers</h2>
              <div className="space-y-3">
                {seats.map((s) => (
                  <div key={s} className="grid grid-cols-[56px_1fr] gap-3">
                    <div className="flex h-12 items-center justify-center bg-navy/[.05] font-display text-lg font-semibold text-navy">{s}</div>
                    <input className={fieldCls} placeholder={`Nom passager siège ${s}`} value={passengers[s] ?? ""} onChange={(e) => setPassengers({ ...passengers, [s]: e.target.value })} />
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-navy/10 bg-white p-6">
              <h2 className="mb-5 font-display text-2xl font-semibold uppercase tracking-[-0.5px] text-navy">Paiement</h2>
              <div className="grid gap-3 sm:grid-cols-3">
                {methods.map((mm) => {
                  const Icon = mm.icon; const active = method === mm.id;
                  return (
                    <button key={mm.id} onClick={() => setMethod(mm.id)}
                      className={cn("border p-4 text-left transition-colors", active ? "border-gold bg-gold/5" : "border-navy/15 hover:border-navy/40")}>
                      <Icon size={22} className={active ? "text-gold" : "text-navy/50"} />
                      <p className="mt-2 font-display text-base font-semibold uppercase tracking-[0.5px] text-navy">{mm.label}</p>
                      <p className="font-body text-xs font-light text-navy/60">{mm.desc}</p>
                    </button>
                  );
                })}
              </div>
              {method === "mobile_money" && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-4 overflow-hidden">
                  <p className="font-body text-sm font-light text-navy/60">Vous serez redirigé vers la page de paiement PAPI pour finaliser via MVola, Orange Money ou Airtel Money.</p>
                </motion.div>
              )}
            </div>
          </div>

          <div className="lg:sticky lg:top-[120px] lg:self-start">
            <div className="border border-navy/10 bg-white p-6">
              <h3 className="font-display text-xl font-semibold uppercase tracking-[-0.5px] text-navy">{draft.origin} <span className="text-gold">→</span> {draft.dest}</h3>
              <p className="mt-1 font-body text-sm font-light text-navy/60">{new Date(draft.departureAt).toLocaleString("fr", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
              <div className="mt-4 space-y-2.5 font-body text-sm">
                <div className="flex justify-between"><span className="font-light text-navy/60">{seats.length} × {fmtMoney(trip?.price ?? draft.price)}</span><span className="font-medium text-navy">{fmtMoney(total)}</span></div>
                <div className="flex justify-between"><span className="font-light text-navy/60">Sièges</span><span className="font-medium text-navy">{seats.join(", ")}</span></div>
              </div>
              <div className="mt-5 flex items-end justify-between border-t border-navy/10 pt-4">
                <span className="font-body text-[11px] font-semibold uppercase tracking-[2px] text-navy/50">Total</span><span className="font-display text-3xl font-semibold text-gold">{fmtMoney(total)}</span>
              </div>
              <button className={`mt-5 ${btnGold}`} disabled={loading || !contact.name || !contact.phone} onClick={pay}>
                {loading ? "Traitement…" : method === "mobile_money" ? `Payer ${fmtMoney(total)} en ligne` : "Réserver · payer à la gare"}
              </button>
              <p className="mt-4 flex items-center justify-center gap-1.5 font-body text-xs font-light text-navy/50"><Lock size={14} className="text-gold" /> Paiement sécurisé</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
