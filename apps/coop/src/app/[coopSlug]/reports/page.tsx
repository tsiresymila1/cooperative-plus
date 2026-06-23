"use client";
import { useMemo } from "react";
import { ChevronRight, Users, Wallet, Activity } from "lucide-react";
import {
  DashboardShell, coopNav, useCoop, db,
  Card, KpiCard, AreaChart, BarList, Donut, PageSkeleton,
  fmtMoney, notDeleted,
} from "@cp/ui";

const dk = (ms: number | string) => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export default function ReportsPage() {
  const { coopId, slug, coop, role, permissions, isPlatformAdmin } = useCoop();

  const { data, isLoading } = db.useQuery({
    bookings: { $: { where: { "cooperative.id": coopId } }, tripInstance: {} },
    payments: { $: { where: { "cooperative.id": coopId, status: "paid" } } },
    tripInstances: { $: { where: { "cooperative.id": coopId } }, tickets: {} },
  });

  const bookings = (data?.bookings ?? []).filter(notDeleted);
  const payments = data?.payments ?? [];
  const trips = (data?.tripInstances ?? []).filter(notDeleted);

  const live = bookings.filter((b: any) => b.status !== "cancelled" && b.status !== "refunded");
  const revenue = payments.reduce((s: number, p: any) => s + (p.amount ?? 0), 0);
  const passengers = live.reduce((s: number, b: any) => s + (b.seatCount ?? 0), 0);
  const revPerTrip = trips.length ? Math.round(revenue / trips.length) : 0;
  const seatsTotal = trips.reduce((s: number, t: any) => s + (t.seatsTotal ?? 0), 0);
  const seatsBooked = trips.reduce((s: number, t: any) => s + (t.tickets?.length ?? 0), 0);
  const occupancy = seatsTotal ? Math.round((seatsBooked / seatsTotal) * 100) : 0;

  // 30-day booking volume series
  const days = useMemo(() => {
    const out: string[] = [];
    for (let i = 29; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); out.push(dk(d.getTime())); }
    return out;
  }, []);
  const series = useMemo(() => days.map((k) => bookings.filter((b: any) => dk(b.createdAt) === k).length), [days, bookings]);
  const labels = days.filter((_, i) => i % 7 === 0).map((k) => { const d = new Date(k); return `${d.getDate()}/${d.getMonth() + 1}`; });

  // revenue by route
  const byRoute = useMemo(() => {
    const m = new Map<string, { label: string; value: number; trips: Set<string>; booked: number; total: number }>();
    for (const b of live) {
      const ti = b.tripInstance;
      const label = ti ? `${ti.originName} → ${ti.destName}` : "—";
      const e = m.get(label) ?? { label, value: 0, trips: new Set<string>(), booked: 0, total: 0 };
      e.value += b.totalAmount ?? 0;
      e.booked += b.seatCount ?? 0;
      if (ti) { e.trips.add(ti.id); e.total += 0; }
      m.set(label, e);
    }
    // seatsTotal per route from trips
    for (const t of trips) {
      const label = `${t.originName} → ${t.destName}`;
      const e = m.get(label);
      if (e && e.trips.has(t.id)) e.total += t.seatsTotal ?? 0;
    }
    return Array.from(m.values()).sort((a, b) => b.value - a.value);
  }, [live, trips]);

  const topRoutes = byRoute.slice(0, 5).map((r) => ({ label: r.label, value: r.value }));

  // booking status donut
  const statusCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const b of bookings) c[b.status] = (c[b.status] ?? 0) + 1;
    return c;
  }, [bookings]);
  const donutSegs = [
    { label: "Payées", value: statusCounts["paid"] ?? 0, color: "var(--color-ink)" },
    { label: "Confirmées", value: statusCounts["confirmed"] ?? 0, color: "var(--color-laterite)" },
    { label: "En attente", value: statusCounts["pending"] ?? 0, color: "#7d96cb" },
    { label: "Annulées", value: (statusCounts["cancelled"] ?? 0) + (statusCounts["refunded"] ?? 0), color: "#c4c6d0" },
  ].filter((s) => s.value > 0);

  const perf = byRoute.slice(0, 8).map((r) => {
    const occ = r.total ? Math.round((r.booked / r.total) * 100) : 0;
    return { ...r, occ };
  });
  const perfTone = (o: number) => (o >= 80 ? { c: "bg-success", t: "success" as const, l: "Performant" } : o >= 50 ? { c: "bg-sky", t: "neutral" as const, l: "Stable" } : { c: "bg-danger", t: "danger" as const, l: "Faible" });

  return (
    <DashboardShell
      nav={coopNav(slug, "reports", { role, permissions, isPlatformAdmin })}
      title="Rapports & Analyses"
      subtitle="Performance, revenus et tendances de la coopérative."
      tenant={coop.displayName}
      logoUrl={coop.logoUrl}
      breadcrumb={<><span>{coop.displayName}</span><ChevronRight size={12} /><span className="text-ink">Rapports</span></>}
    >
      {isLoading ? (
        <PageSkeleton />
      ) : (
        <div className="space-y-5 stagger-children">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Passagers" value={String(passengers)} icon={<Users size={18} />} pill={{ text: "réservés", tone: "neutral" }} />
            <KpiCard label="Revenu total" value={fmtMoney(revenue)} spark={series} trend={`${live.length} résa.`} trendDir="up" />
            <KpiCard label="Revenu / trajet" value={fmtMoney(revPerTrip)} icon={<Wallet size={18} />} pill={{ text: `${trips.length} trajets`, tone: "neutral" }} />
            <KpiCard label="Taux d'occupation" value={`${occupancy}%`} progress={occupancy} />
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <Card className="p-6 lg:col-span-2">
              <h3 className="font-display text-lg font-bold text-ink">Volume des réservations</h3>
              <p className="mb-5 text-sm text-ink-soft">30 derniers jours</p>
              <AreaChart data={series} labels={labels} height={240} />
            </Card>
            <Card className="p-6">
              <h3 className="mb-5 font-display text-lg font-bold text-ink">Statut des réservations</h3>
              {donutSegs.length ? (
                <Donut segments={donutSegs} centerValue={String(bookings.length)} centerLabel="Total" />
              ) : (
                <p className="text-sm text-ink-soft/60">Aucune réservation.</p>
              )}
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <Card className="p-6">
              <h3 className="mb-5 font-display text-lg font-bold text-ink">Revenu par itinéraire</h3>
              <BarList items={topRoutes} format={fmtMoney} />
            </Card>

            <Card className="overflow-hidden lg:col-span-2">
              <div className="border-b border-ink/8 px-6 py-4">
                <h3 className="font-display text-lg font-bold text-ink">Performance des itinéraires</h3>
              </div>
              {perf.length === 0 ? (
                <p className="px-6 py-10 text-center text-sm text-ink-soft/60">Aucune donnée.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-ink/[.02] text-left text-[11px] font-bold uppercase tracking-[0.08em] text-ink-soft/55">
                    <tr className="border-b border-ink/8">
                      <th className="px-6 py-3">Itinéraire</th>
                      <th className="px-6 py-3 hidden sm:table-cell">Trajets</th>
                      <th className="px-6 py-3">Occupation</th>
                      <th className="px-6 py-3">Revenu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {perf.map((r) => {
                      const tone = perfTone(r.occ);
                      return (
                        <tr key={r.label} className="border-b border-ink/[.06] last:border-0 hover:bg-ink/[.03]">
                          <td className="px-6 py-3.5">
                            <span className="inline-flex items-center gap-2.5">
                              <span className="grid h-8 w-8 place-items-center rounded-lg bg-ink/[.05] text-ink-soft"><Activity size={15} /></span>
                              <span className="font-medium text-ink">{r.label}</span>
                            </span>
                          </td>
                          <td className="px-6 py-3.5 hidden text-ink-soft sm:table-cell">{r.trips.size}</td>
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-ink/[.08]">
                                <div className={`h-full rounded-full ${tone.c}`} style={{ width: `${Math.max(4, r.occ)}%` }} />
                              </div>
                              <span className="text-xs font-bold text-ink tabular-nums">{r.occ}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-3.5 font-semibold text-ink tabular-nums">{fmtMoney(r.value)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </Card>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
