"use client";
import { use } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { QRCodeSVG } from "qrcode.react";
import { CheckCircle2, Download } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Button, Card, CoopLogo, SeatSelector, type Cell } from "@cp/ui";
import { db } from "@cp/ui";
import { fmtMoney } from "@cp/ui";

export default function Confirmation({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = use(params);
  const { data, isLoading } = db.useQuery({
    bookings: { $: { where: { reference } }, tickets: {}, tripInstance: { cooperative: {}, vehicle: { seatMaps: {} } } },
  });
  const bk = data?.bookings?.[0];
  const trip = bk?.tripInstance;

  // Seat-map preview for the ticket: layout from the vehicle (or snapshot),
  // with the passenger's own seats highlighted.
  const ownSeats = (bk?.tickets ?? []).map((t) => t.seatLabel as string);
  const activeMap = (trip?.vehicle?.seatMaps ?? []).find((m: any) => m.isActive) ?? (trip?.vehicle?.seatMaps ?? [])[0];
  const layout: Cell[] = Array.isArray(activeMap?.layout)
    ? (activeMap.layout as Cell[])
    : Array.isArray((trip as any)?.seatMapSnapshot) ? ((trip as any).seatMapSnapshot as Cell[]) : [];

  return (
    <>
      <SiteHeader />
      {/* Print: show only the ticket */}
      <style>{`@media print { body * { visibility: hidden !important; } #ticket, #ticket * { visibility: visible !important; } #ticket { position: absolute; inset: 0 auto auto 0; width: 100%; } }`}</style>
      <main className="mx-auto max-w-lg px-5 py-12">
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", damping: 14 }}
          className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full bg-baobab/15 text-baobab">
          <CheckCircle2 size={36} />
        </motion.div>
        <h1 className="text-center font-display text-3xl font-bold">{bk?.status === "pending" ? "Réservation enregistrée" : "Réservation confirmée"}</h1>
        <p className="mt-2 text-center text-ink-soft">{bk?.status === "pending" ? "Payez à la gare avant le départ." : "Présentez le QR code à l'embarquement."}</p>

        <motion.div id="ticket" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }} className="mt-8">
          <Card className="overflow-hidden p-0 border-0">
            <div className="bg-strong p-5 text-white">
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2.5">
                  <CoopLogo url={trip?.cooperative?.logoUrl} name={trip?.coopName} size={34} className="rounded-lg border border-white/20" />
                  <span className="font-display text-base font-bold leading-tight">{trip?.coopName ?? "Cooperative Plus"}</span>
                </span>
                <span className="text-right">
                  <span className="block text-[10px] uppercase tracking-widest text-white/55">Référence</span>
                  <span className="font-mono text-base font-bold tracking-wider text-clay">{reference}</span>
                </span>
              </div>
              <div className="mt-4 font-display text-2xl font-bold">
                {trip ? `${trip.originName} → ${trip.destName}` : (isLoading ? "Chargement…" : "—")}
              </div>
              {trip && <p className="mt-1 font-mono text-sm text-white/70">{new Date(trip.departureAt).toLocaleString("fr", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}</p>}
            </div>
            <div className="relative border-y border-dashed border-ink/15">
              <span className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-sand" />
              <span className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-sand" />
            </div>
            <div className="flex items-center gap-5 p-5">
              <div className="grid shrink-0 place-items-center rounded-xl border border-ink/10 bg-paper p-2">
                <QRCodeSVG value={reference} size={96} level="M" />
              </div>
              <div className="flex-1 space-y-1.5 text-sm">
                <Row label="Sièges" value={(bk?.tickets ?? []).map((t) => t.seatLabel).sort().join(", ") || "—"} />
                <Row label="Passagers" value={String(bk?.seatCount ?? "—")} />
                <Row label="Total" value={bk ? fmtMoney(bk.totalAmount) : "—"} />
                <Row label="Statut" value={bk?.status === "pending" ? "En attente" : "Confirmé ✓"} />
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Seat preview — screen only (excluded from print) */}
        {layout.length > 0 && (
          <Card className="mt-6 p-5 print:hidden">
            <p className="mb-3 text-center text-[11px] font-bold uppercase tracking-widest text-ink-soft/60">Vos places</p>
            <div className="flex justify-center overflow-x-auto">
              <div className="pointer-events-none origin-top scale-90">
                <SeatSelector layout={layout} taken={[]} selected={ownSeats} onToggle={() => {}} />
              </div>
            </div>
          </Card>
        )}

        <div className="mt-6 flex gap-3 print:hidden">
          <Button variant="outline" className="flex-1" onClick={() => window.print()}><Download size={16} /> Télécharger</Button>
          <Link href="/account/bookings" className="flex-1"><Button className="w-full">Mes réservations</Button></Link>
        </div>
      </main>
    </>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between"><span className="text-ink-soft">{label}</span><span className="font-semibold text-ink">{value}</span></div>;
}
