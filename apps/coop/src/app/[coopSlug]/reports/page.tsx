"use client";
import { useMemo } from "react";
import { ChevronRight, Users, Wallet, Activity } from "lucide-react";
import {
  DashboardShell, coopNav, useCoop, db,
  StatCard, ComponentCard, Badge, AreaChart, BarList, Donut, PageSkeleton,
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
        <div className="grid grid-cols-12 gap-4 md:gap-6">
          {/* KPI metric grid */}
          <div className="col-span-12 grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
            <StatCard label="Passagers" value={String(passengers)} icon={<Users size={22} />} hint="réservés" />
            <StatCard label="Revenu total" value={fmtMoney(revenue)} tone="laterite" icon={<Wallet size={22} />} hint={`${live.length} résa.`} trend="up" />
            <StatCard label="Revenu / trajet" value={fmtMoney(revPerTrip)} icon={<Wallet size={22} />} hint={`${trips.length} trajets`} />
            <StatCard label="Taux d'occupation" value={`${occupancy}%`} icon={<Activity size={22} />} hint={`${seatsBooked}/${seatsTotal} places`} />
          </div>

          {/* volume + status */}
          <div className="col-span-12 xl:col-span-8">
            <ComponentCard title="Volume des réservations" desc="30 derniers jours">
              <AreaChart data={series} labels={labels} height={240} />
            </ComponentCard>
          </div>
          <div className="col-span-12 xl:col-span-4">
            <ComponentCard title="Statut des réservations">
              {donutSegs.length ? (
                <Donut segments={donutSegs} centerValue={String(bookings.length)} centerLabel="Total" />
              ) : (
                <p className="text-sm text-ink-soft/60">Aucune réservation.</p>
              )}
            </ComponentCard>
          </div>

          {/* revenue by route + performance */}
          <div className="col-span-12 xl:col-span-4">
            <ComponentCard title="Revenu par itinéraire">
              <BarList items={topRoutes} format={fmtMoney} />
            </ComponentCard>
          </div>
          <div className="col-span-12 xl:col-span-8">
            <ComponentCard title="Performance des itinéraires" bodyClassName="p-0">
              {perf.length === 0 ? (
                <p className="px-6 py-10 text-center text-sm text-ink-soft/60">Aucune donnée.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[42rem] text-sm">
                    <thead className="bg-sand text-left text-xs font-medium uppercase tracking-wider text-ink-soft">
                      <tr className="border-b border-line">
                        <th className="px-6 py-3.5">Itinéraire</th>
                        <th className="px-6 py-3.5 hidden sm:table-cell">Trajets</th>
                        <th className="px-6 py-3.5">Occupation</th>
                        <th className="px-6 py-3.5">Statut</th>
                        <th className="px-6 py-3.5">Revenu</th>
                      </tr>
                    </thead>
                    <tbody>
                      {perf.map((r) => {
                        const tone = perfTone(r.occ);
                        return (
                          <tr key={r.label} className="border-b border-line last:border-0 hover:bg-ink/[.02]">
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
                            <td className="px-6 py-3.5"><Badge tone={tone.t}>{tone.l}</Badge></td>
                            <td className="px-6 py-3.5 font-semibold text-ink tabular-nums">{fmtMoney(r.value)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </ComponentCard>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
