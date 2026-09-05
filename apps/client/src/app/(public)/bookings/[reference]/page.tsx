"use client";
import { use, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import { QRCodeSVG } from "qrcode.react";
import { CheckCircle2, Clock, Download, Loader2, X, XCircle, CreditCard, Bus, MapPin } from "lucide-react";
import { CoopLogo, SeatSelector, TagBadge, useConfirm, type Cell } from "@cp/ui";
import { db } from "@cp/ui";
import { fmtMoney, toast } from "@cp/ui";

const btnGold =
  "inline-flex h-14 w-full items-center justify-center gap-2 px-6 font-display text-[15px] font-semibold uppercase tracking-[0.5px] transition-colors duration-200 bg-gold text-navy hover:bg-navy hover:text-white disabled:cursor-not-allowed disabled:opacity-50";
const btnOutline =
  "inline-flex h-14 w-full items-center justify-center gap-2 px-6 font-display text-[15px] font-semibold uppercase tracking-[0.5px] transition-colors duration-200 border border-navy/20 bg-white text-navy hover:bg-navy hover:text-white";
const btnDanger =
  "inline-flex h-14 w-full items-center justify-center gap-2 px-6 font-display text-[15px] font-semibold uppercase tracking-[0.5px] transition-colors duration-200 border border-sale/30 bg-white text-sale hover:bg-sale hover:text-white";

export default function Confirmation({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentParam = searchParams.get("payment"); // "success" | "failed" | null
  const [paying, setPaying] = useState(false);
  const confirm = useConfirm();

  const payOnline = async () => {
    setPaying(true);
    try {
      const res = await fetch("/api/payment/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingReference: reference }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Erreur paiement"); setPaying(false); return; }
      window.location.href = data.url;
    } catch {
      toast.error("Erreur réseau");
      setPaying(false);
    }
  };

  const { data, isLoading } = db.useQuery({
    bookings: { $: { where: { reference } }, tickets: { tripVehicle: {} }, payments: {}, tripInstance: { cooperative: {}, vehicle: { seatMaps: {} }, tag: {} } },
  });
  const bk = data?.bookings?.[0];
  const trip = bk?.tripInstance;

  // Vehicle/driver for this ticket: from the linked tripVehicle (multi-vehicle),
  // else fall back to the trip's own vehicle/driver (legacy mono-vehicle).
  const tv: any = (bk?.tickets ?? []).map((t: any) => t.tripVehicle).find(Boolean);
  const vehLabel = tv?.label ?? "Voiture 1";
  const vehReg = tv?.registrationNo ?? (trip as any)?.vehicle?.registrationNo ?? null;
  const vehDriver = tv?.driverName ?? (trip as any)?.driverName ?? null;

  // Seat-map preview for the ticket: layout from the vehicle (or snapshot),
  // with the passenger's own seats highlighted.
  const ownSeats = (bk?.tickets ?? []).map((t) => t.seatLabel as string);
  // tag may come back as object or single-item array depending on the link traversal.
  const tag: any = Array.isArray((trip as any)?.tag) ? (trip as any).tag[0] : (trip as any)?.tag;
  const activeMap = (trip?.vehicle?.seatMaps ?? []).find((m: any) => m.isActive) ?? (trip?.vehicle?.seatMaps ?? [])[0];
  const layout: Cell[] = Array.isArray(activeMap?.layout)
    ? (activeMap.layout as Cell[])
    : Array.isArray((trip as any)?.seatMapSnapshot) ? ((trip as any).seatMapSnapshot as Cell[]) : [];

  // Status-aware header + label.
  const status = bk?.status ?? "";
  const dead = ["cancelled", "expired", "refunded", "no_show"].includes(status);
  const awaitingPayment = status === "pending" && paymentParam === "success";
  const head = dead
    ? { Icon: XCircle, wrap: "bg-sale/15 text-sale",
        title: { cancelled: "Réservation annulée", expired: "Réservation expirée", refunded: "Réservation remboursée", no_show: "Passager absent" }[status] ?? "Réservation annulée",
        sub: "Cette réservation n'est plus valide." }
    : awaitingPayment
      ? { Icon: Loader2, wrap: "bg-navy/10 text-navy", title: "Vérification du paiement…", sub: "Paiement en cours de traitement. Page mise à jour automatiquement." }
      : status === "pending"
        ? { Icon: Clock, wrap: "bg-gold/15 text-gold", title: "Réservation enregistrée", sub: "Payez à la gare avant le départ." }
        : { Icon: CheckCircle2, wrap: "bg-stock/15 text-stock", title: "Réservation confirmée", sub: "Présentez le QR code à l'embarquement." };
  const STATUS_FR: Record<string, string> = { pending: "En attente", confirmed: "Confirmé", paid: "Payé", cancelled: "Annulé", refunded: "Remboursé", expired: "Expiré", completed: "Terminé", no_show: "Absent" };
  const canPayOnline = status === "pending";
  const statusTone = dead ? "bg-sale/15 text-sale" : status === "pending" ? "bg-gold/15 text-gold" : "bg-stock/15 text-stock";

  // Cancellable only while unpaid (pending). Frees the seats (delete own tickets).
  const cancelBooking = async () => {
    if (!bk) return;
    if (!(await confirm({ title: "Annuler la réservation ?", message: `${reference} · ${fmtMoney(bk.totalAmount)}`, confirmLabel: "Annuler", tone: "danger" }))) return;
    try {
      await db.transact([
        db.tx.bookings[bk.id].update({ status: "cancelled", cancelledAt: Date.now() }),
        ...(bk.tickets ?? []).map((t: any) => db.tx.tickets[t.id].delete()),
      ]);
      toast.success("Réservation annulée");
    } catch (e: any) {
      toast.error(e?.message ?? "Échec de l'annulation.");
    }
  };

  return (
    <main className="pt-[100px]">
      {/* Print: show only the ticket */}
      <style>{`@media print { body * { visibility: hidden !important; } #ticket, #ticket * { visibility: visible !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; } #ticket { position: absolute; inset: 0 auto auto 0; width: 100%; } }`}</style>
      <div className="mx-auto max-w-content px-[15px] py-12 lg:py-16">
        <div className="mx-auto max-w-lg">
          <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", damping: 14 }}
            className={`mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full ${head.wrap}`}>
            <head.Icon size={36} className={awaitingPayment ? "animate-spin" : undefined} />
          </motion.div>
          <h1 className="text-center font-display text-[38px] font-semibold uppercase leading-none tracking-[-1px] text-navy">{head.title}</h1>
          <p className="mt-3 text-center font-body font-light text-navy/60">{head.sub}</p>

          {/* Payment redirect banner */}
          {paymentParam === "success" && status === "pending" && (
            <div className="mt-4 flex items-center justify-center gap-2 border border-gold/30 bg-gold/10 px-4 py-3 font-body text-sm text-navy">
              <Loader2 size={15} className="animate-spin text-gold" />
              Paiement en cours de vérification…
            </div>
          )}
          {paymentParam === "failed" && (
            <div className="mt-4 border border-sale/30 bg-sale/10 px-4 py-3 text-center font-body text-sm text-sale">
              Le paiement a échoué. Réessayez ou payez à la gare.
            </div>
          )}
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
        {/* ── Left: ticket + seat preview ── */}
        <div className="space-y-6">
        <motion.div id="ticket" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}>
          {/* Boarding pass — Tourix "bus ticket" artwork, built as a real card. */}
          <div className="relative flex overflow-hidden bg-white shadow-[0_24px_60px_-28px_rgba(20,49,76,.55)]">
            {/* Gold stub */}
            <div className="relative flex w-[140px] shrink-0 flex-col items-center justify-between bg-gold py-5">
              <Bus className="size-6 text-navy" strokeWidth={2} />
              <span className="font-display text-[15px] font-bold uppercase tracking-[0.35em] text-navy [writing-mode:vertical-rl] rotate-180">Bus Ticket</span>
              <Bus className="size-6 text-navy" strokeWidth={2} />
              <span aria-hidden className="absolute -right-2.5 top-0 h-full w-5 [background:radial-gradient(circle_at_left,transparent_9px,#fff_10px)] [background-size:100%_20px]" />
            </div>

            {/* Body — dotted "map" texture */}
            <div className="relative min-w-0 flex-1" style={{ backgroundImage: "radial-gradient(rgba(20,49,76,.06) 1px, transparent 1px)", backgroundSize: "14px 14px" }}>
              <div className="flex items-start justify-between gap-3 border-b border-dashed border-navy/15 p-5">
                <span className="flex items-center gap-2.5">
                  <CoopLogo url={trip?.cooperative?.logoUrl} name={trip?.coopName} size={34} className="rounded-none border border-navy/10" />
                  <span className="min-w-0 font-display text-lg font-semibold uppercase leading-tight text-navy">{trip?.coopName ?? "Cooperative Plus"}</span>
                  {tag && <TagBadge name={tag.name} color={tag.color} />}
                </span>
                <span className="shrink-0 text-right">
                  <span className="block font-body text-[10px] uppercase tracking-[2px] text-navy/45">Référence</span>
                  <span className="font-display text-lg font-bold tracking-wider text-gold">{reference}</span>
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 p-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-display text-[26px] font-semibold uppercase leading-none tracking-[-0.5px] text-navy">
                    <span className="inline-flex items-center gap-1.5"><MapPin size={16} className="text-gold" /> {trip ? trip.originName : (isLoading ? "…" : "—")}</span>
                    <span className="text-gold">→</span>
                    <span className="inline-flex items-center gap-1.5"><MapPin size={16} className="text-gold" /> {trip?.destName ?? ""}</span>
                  </div>
                  {trip && <p className="mt-2 font-body text-sm font-light text-navy/60">{new Date(trip.departureAt).toLocaleString("fr", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}</p>}
                </div>
                <div className="grid shrink-0 place-items-center border border-navy/10 bg-white p-2">
                  <QRCodeSVG value={reference} size={92} level="M" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 border-t border-dashed border-navy/15 p-5 font-body text-sm sm:grid-cols-3">
                <Row label="Sièges" value={(bk?.tickets ?? []).map((t) => t.seatLabel).sort().join(", ") || "—"} />
                <Row label="Véhicule" value={vehReg ? `${vehLabel} · ${vehReg}` : vehLabel} />
                {vehDriver && <Row label="Chauffeur" value={vehDriver} />}
                <Row label="Passagers" value={String(bk?.seatCount ?? "—")} />
                <Row label="Total" value={bk ? fmtMoney(bk.totalAmount) : "—"} />
                <Row label="Statut" value={<span className={`px-2 py-0.5 font-display text-[11px] font-semibold uppercase tracking-wide ${statusTone}`}>{STATUS_FR[status] ?? status ?? "—"}</span>} />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Seat preview — screen only (excluded from print) */}
        {layout.length > 0 && !["cancelled", "expired", "refunded", "no_show"].includes(status) && (
          <div className="border border-navy/10 bg-white p-5 print:hidden">
            <p className="mb-3 text-center font-body text-[11px] font-semibold uppercase tracking-[2px] text-navy/50">Vos places</p>
            <div className="flex justify-center overflow-x-auto">
              <div className="pointer-events-none origin-top scale-90">
                <SeatSelector layout={layout} taken={[]} selected={ownSeats} onToggle={() => {}} />
              </div>
            </div>
          </div>
        )}
        </div>

        {/* ── Right: actions (sticky) ── */}
        <div className="space-y-3 print:hidden lg:sticky lg:top-[120px]">
          {canPayOnline && (
            <button className={btnGold} onClick={payOnline} disabled={paying}>
              {paying ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
              {paying ? "Redirection…" : "Payer en ligne"}
            </button>
          )}
          <button className={btnOutline} onClick={() => window.print()}><Download size={16} /> Télécharger</button>
          <Link href="/account/bookings" className="block"><span className={btnOutline}>Mes réservations</span></Link>
          {status === "pending" && (
            <button className={btnDanger} onClick={cancelBooking}>
              <X size={16} /> Annuler la réservation
            </button>
          )}
        </div>
        </div>
      </div>
    </main>
  );
}
function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="flex items-center justify-between"><span className="font-light text-navy/60">{label}</span><span className="font-medium text-navy">{value}</span></div>;
}
