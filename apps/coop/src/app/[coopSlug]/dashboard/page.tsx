"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarClock, Ticket, Activity, Wallet, Bus, Plus, CalendarPlus, ChevronRight,
  ArrowRight, History, ArrowUpRight,
} from "lucide-react";
import {
  DashboardShell, coopNav, useCoop, db,
  Card, KpiCard, AreaChart, PageSkeleton,
  fmtMoney, fmtTime, fmtDateTime, todayISO, notDeleted, TagBadge,
} from "@cp/ui";

const dk = (ms: number | string) => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const WD = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
function relTime(ms: number) {
  const s = Math.floor((Date.now() - new Date(ms).getTime()) / 1000);
  if (s < 60) return "à l'instant";
  if (s < 3600) return `il y a ${Math.floor(s / 60)} min`;
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`;
  return `il y a ${Math.floor(s / 86400)} j`;
}

export default function DashboardPage() {
  const { coopId, slug, coop, role, permissions, isPlatformAdmin } = useCoop();
  const router = useRouter();
  const today = todayISO();
  const [range, setRange] = useState<7 | 30>(7);

  const { data, isLoading } = db.useQuery({
    tripInstances: { $: { where: { "cooperative.id": coopId } }, tickets: {}, tag: {} },
    payments: { $: { where: { "cooperative.id": coopId, status: "paid" } } },
    vehicles: { $: { where: { "cooperative.id": coopId } } },
    bookings: { $: { where: { "cooperative.id": coopId }, order: { createdAt: "desc" } }, tripInstance: { tag: {} } },
  });

  const instances = (data?.tripInstances ?? []).filter(notDeleted);
  const payments = data?.payments ?? [];
  const vehicles = (data?.vehicles ?? []).filter(notDeleted);
  const bookings = (data?.bookings ?? []).filter(notDeleted);
  const recent = bookings.slice(0, 5);

  const now = Date.now();
  const todayDepartures = instances
    .filter((t: any) => new Date(t.departureAt).getTime() >= now && t.status !== "cancelled")
    .sort((a: any, b: any) => new Date(a.departureAt).getTime() - new Date(b.departureAt).getTime())
    .slice(0, 6);

  const upcoming = instances.filter((t: any) => new Date(t.departureAt).getTime() >= now && t.status !== "cancelled");
  const seatsTotal = upcoming.reduce((s: number, t: any) => s + (t.seatsTotal ?? 0), 0);
  const seatsBooked = upcoming.reduce((s: number, t: any) => s + (t.tickets?.length ?? 0), 0);
  const occupancy = seatsTotal > 0 ? Math.round((seatsBooked / seatsTotal) * 100) : 0;

  const revenueToday = payments.filter((p: any) => dk(p.paidAt ?? p.createdAt) === today).reduce((s: number, p: any) => s + (p.amount ?? 0), 0);
  const revenueYday = (() => {
    const y = new Date(); y.setDate(y.getDate() - 1); const k = dk(y.getTime());
    return payments.filter((p: any) => dk(p.paidAt ?? p.createdAt) === k).reduce((s: number, p: any) => s + (p.amount ?? 0), 0);
  })();
  const resToday = bookings.filter((b: any) => dk(b.createdAt) === today).length;

  const activeVehicles = vehicles.filter((v: any) => v.status === "active").length;
  const maintenance = vehicles.filter((v: any) => v.status === "maintenance").length;

  // series for the chart + sparklines (last `range` days, oldest→newest)
  const days = useMemo(() => {
    const out: { key: string; label: string }[] = [];
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      out.push({ key: dk(d.getTime()), label: WD[(d.getDay() + 6) % 7]! });
    }
    return out;
  }, [range]);
  const resSeries = useMemo(() => days.map((d) => bookings.filter((b: any) => dk(b.createdAt) === d.key).length), [days, bookings]);
  const revSeries = useMemo(() => days.map((d) => payments.filter((p: any) => dk(p.paidAt ?? p.createdAt) === d.key).reduce((s: number, p: any) => s + (p.amount ?? 0), 0)), [days, payments]);
  const chartLabels = range === 7 ? days.map((d) => d.label) : days.filter((_, i) => i % 6 === 0).map((d) => d.label);

  // r = occupancy ratio (booked/total). Green = seats available, red = full.
  const occColor = (r: number) => (r >= 1 ? "bg-danger" : r >= 0.8 ? "bg-laterite" : "bg-success");
  const dotColor = (s: string) => (s === "paid" ? "bg-success" : s === "cancelled" || s === "refunded" ? "bg-danger" : s === "pending" ? "bg-laterite" : "bg-sky");

  const quickActions = [
    { href: `/${slug}/trips/new`, label: "Nouveau trajet", icon: <Plus size={16} />, primary: true },
    { href: `/${slug}/trips/recurring`, label: "Trajet récurrent", icon: <CalendarPlus size={16} /> },
    { href: `/${slug}/vehicles/new`, label: "Nouveau véhicule", icon: <Bus size={16} /> },
  ];

  return (
    <DashboardShell
      nav={coopNav(slug, "dashboard", { role, permissions, isPlatformAdmin })}
      title="Tableau de bord"
      subtitle="Revenus, occupation et activité de la coopérative."
      tenant={coop.displayName}
      logoUrl={coop.logoUrl}
    >
      {isLoading ? (
        <PageSkeleton />
      ) : (
        <div className="space-y-5 stagger-children">
          {/* KPI row */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              label="Revenus du jour" value={fmtMoney(revenueToday)} spark={revSeries}
              trend={revenueYday > 0 ? `${Math.round(((revenueToday - revenueYday) / revenueYday) * 100)}%` : undefined}
              trendDir={revenueToday >= revenueYday ? "up" : "down"}
            />
            <KpiCard label="Réservations du jour" value={String(resToday)} spark={resSeries} trend={`${upcoming.length} à venir`} trendDir="up" />
            <KpiCard label="Taux d'occupation" value={`${occupancy}%`} progress={occupancy} />
            <KpiCard
              label="Véhicules actifs" value={String(activeVehicles)} valueSub={`/ ${vehicles.length}`}
              pill={maintenance > 0 ? { text: `${maintenance} en maintenance`, tone: "warning" } : { text: "Tous opérationnels", tone: "neutral" }}
              icon={<Bus size={18} />}
            />
          </div>

          {/* main grid */}
          <div className="grid grid-cols-12 gap-5">
            {/* left */}
            <div className="col-span-12 space-y-5 lg:col-span-8">
              {/* chart */}
              <Card className="p-6">
                <div className="mb-6 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-display text-lg font-bold text-ink">Aperçu des réservations</h3>
                    <p className="text-sm text-ink-soft">Volume {range === 7 ? "des 7 derniers jours" : "des 30 derniers jours"}</p>
                  </div>
                  <div className="flex gap-1 rounded-xl bg-ink/[.04] p-1">
                    {([7, 30] as const).map((r) => (
                      <button key={r} onClick={() => setRange(r)}
                        className={`rounded-lg px-3 py-1 text-xs font-bold transition-all ${range === r ? "bg-paper text-ink shadow-sm" : "text-ink-soft/70 hover:text-ink"}`}>
                        {r}J
                      </button>
                    ))}
                  </div>
                </div>
                <AreaChart data={resSeries} labels={chartLabels} height={240} />
              </Card>

              {/* upcoming departures */}
              <Card className="overflow-hidden">
                <div className="flex items-center justify-between border-b border-ink/8 px-6 py-4">
                  <h3 className="font-display text-lg font-bold text-ink">Prochains départs</h3>
                  <Link href={`/${slug}/trips`} className="inline-flex items-center gap-1 text-sm font-semibold text-laterite hover:underline">
                    Voir le planning <ArrowRight size={15} />
                  </Link>
                </div>
                {todayDepartures.length === 0 ? (
                  <p className="px-6 py-10 text-center text-sm text-ink-soft/60">Aucun départ à venir.</p>
                ) : (
                  <div className="overflow-x-auto"><table className="w-full min-w-[42rem] text-sm">
                    <thead className="bg-ink/[.02] text-left text-[11px] font-bold uppercase tracking-[0.08em] text-ink-soft/55">
                      <tr className="border-b border-ink/8">
                        <th className="px-6 py-3">Trajet</th>
                        <th className="px-6 py-3">Heure</th>
                        <th className="px-6 py-3 hidden sm:table-cell">Véhicule</th>
                        <th className="px-6 py-3">Places libres</th>
                        <th className="px-6 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {todayDepartures.map((t: any) => {
                        const booked = t.tickets?.length ?? 0;
                        const ratio = t.seatsTotal ? booked / t.seatsTotal : 0;
                        return (
                          <tr key={t.id} onClick={() => router.push(`/${slug}/trips/${t.id}`)}
                            className="group cursor-pointer border-b border-ink/[.06] transition-colors last:border-0 hover:bg-ink/[.03]">
                            <td className="px-6 py-3.5">
                              <div className="flex items-center gap-3">
                                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-strong text-[11px] font-bold text-white">
                                  {String(t.originName ?? "?").slice(0, 2).toUpperCase()}
                                </span>
                                <span className="font-medium text-ink">{t.originName} → {t.destName}</span>
                                {t.tag && <TagBadge name={t.tag.name} color={t.tag.color} />}
                              </div>
                            </td>
                            <td className="px-6 py-3.5 font-mono text-ink-soft">{fmtTime(t.departureAt)}</td>
                            <td className="px-6 py-3.5 hidden text-ink-soft sm:table-cell">{t.vehicleName}</td>
                            <td className="px-6 py-3.5">
                              <div className="flex items-center gap-2">
                                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-ink/[.08]">
                                  <div className={`h-full rounded-full ${occColor(ratio)}`} style={{ width: `${Math.max(6, ratio * 100)}%` }} />
                                </div>
                                <span className="text-xs font-bold text-ink tabular-nums">{(t.seatsTotal ?? 0) - booked}/{t.seatsTotal}</span>
                              </div>
                            </td>
                            <td className="px-6 py-3.5 text-right">
                              <ChevronRight size={16} className="ml-auto text-ink-soft/40 transition-colors group-hover:text-laterite" />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table></div>
                )}
              </Card>
            </div>

            {/* right rail */}
            <div className="col-span-12 space-y-5 lg:col-span-4">
              {/* quick actions */}
              <Card className="relative overflow-hidden border-0 bg-strong p-6 text-white">
                <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5 blur-3xl" />
                <h3 className="relative font-display text-lg font-bold">Actions rapides</h3>
                <p className="relative mt-1 text-sm text-white/60">Créez et gérez en un clic.</p>
                <div className="relative mt-5 flex flex-col gap-2.5">
                  {quickActions.map((a) => (
                    <Link key={a.href} href={a.href}
                      className={`flex items-center justify-between rounded-xl px-4 py-3 text-[13.5px] font-semibold transition-all active:scale-[.98] ${
                        a.primary
                          ? "bg-laterite text-white hover:brightness-105"
                          : "border border-white/15 bg-white/[.08] text-white hover:bg-white/[.16]"}`}>
                      <span className="inline-flex items-center gap-2.5">{a.icon} {a.label}</span>
                      <ChevronRight size={16} className="opacity-60" />
                    </Link>
                  ))}
                </div>
              </Card>

              {/* recent activity */}
              <Card className="p-6">
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="font-display text-lg font-bold text-ink">Activité récente</h3>
                  <History size={16} className="text-ink-soft/50" />
                </div>
                {recent.length === 0 ? (
                  <p className="text-sm text-ink-soft/60">Aucune activité.</p>
                ) : (
                  <div className="space-y-5">
                    {recent.map((b: any) => (
                      <Link key={b.id} href={`/${slug}/bookings/${b.id}`} className="flex gap-3.5">
                        <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dotColor(b.status)}`} />
                        <div className="min-w-0">
                          <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-ink">
                            {b.contactName ?? "Réservation"}
                            {b.tripInstance?.tag && <TagBadge name={b.tripInstance.tag.name} color={b.tripInstance.tag.color} />}
                          </p>
                          <p className="truncate text-xs text-ink-soft">
                            {b.tripInstance ? `${b.tripInstance.originName} → ${b.tripInstance.destName}` : `Réservation #${b.reference}`}
                            {" · "}{b.seatCount} place(s) · {fmtMoney(b.totalAmount)}
                          </p>
                          <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-ink-soft/55">
                            {b.tripInstance ? `Départ ${fmtDateTime(b.tripInstance.departureAt)}` : relTime(b.createdAt)}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
                <Link href={`/${slug}/bookings`}
                  className="mt-6 flex items-center justify-center gap-1.5 rounded-xl border border-ink/12 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-ink/[.04]">
                  Toutes les réservations <ArrowUpRight size={15} />
                </Link>
              </Card>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
