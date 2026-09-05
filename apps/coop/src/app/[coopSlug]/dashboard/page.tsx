"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Ticket, Activity, Wallet, Bus, Plus, CalendarPlus, ChevronRight,
  ArrowRight, History, ArrowUpRight,
} from "lucide-react";
import {
  DashboardShell, coopNav, useCoop, db,
  StatCard, ComponentCard, Button, AreaChart, PageSkeleton,
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
        <div className="grid grid-cols-12 gap-4 md:gap-6">
          {/* KPI metric grid */}
          <div className="col-span-12 grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
            <StatCard
              label="Revenus du jour"
              value={fmtMoney(revenueToday)}
              tone="laterite"
              icon={<Wallet size={22} />}
              hint={revenueYday > 0 ? `${Math.abs(Math.round(((revenueToday - revenueYday) / revenueYday) * 100))}%` : undefined}
              trend={revenueToday >= revenueYday ? "up" : "down"}
            />
            <StatCard
              label="Réservations du jour"
              value={String(resToday)}
              icon={<Ticket size={22} />}
              hint={`${upcoming.length} à venir`}
              trend="up"
            />
            <StatCard
              label="Taux d'occupation"
              value={`${occupancy}%`}
              icon={<Activity size={22} />}
              hint={`${seatsBooked}/${seatsTotal} places`}
            />
            <StatCard
              label="Véhicules actifs"
              value={`${activeVehicles} / ${vehicles.length}`}
              icon={<Bus size={22} />}
              hint={maintenance > 0 ? `${maintenance} en maintenance` : "Tous opérationnels"}
            />
          </div>

          {/* left column */}
          <div className="col-span-12 space-y-4 md:space-y-6 xl:col-span-8">
            {/* chart */}
            <ComponentCard
              title="Aperçu des réservations"
              desc={`Volume ${range === 7 ? "des 7 derniers jours" : "des 30 derniers jours"}`}
              action={
                <div className="flex gap-1 rounded-lg bg-ink/[.04] p-1">
                  {([7, 30] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setRange(r)}
                      className={`rounded-md px-3 py-1 text-xs font-semibold transition-all ${range === r ? "bg-paper text-ink shadow-sm" : "text-ink-soft/70 hover:text-ink"}`}
                    >
                      {r}J
                    </button>
                  ))}
                </div>
              }
            >
              <AreaChart data={resSeries} labels={chartLabels} height={240} />
            </ComponentCard>

            {/* upcoming departures */}
            <ComponentCard
              title="Prochains départs"
              action={
                <Link href={`/${slug}/trips`} className="inline-flex items-center gap-1 text-sm font-medium text-laterite hover:underline">
                  Voir le planning <ArrowRight size={15} />
                </Link>
              }
              bodyClassName="p-0"
            >
              {todayDepartures.length === 0 ? (
                <p className="px-6 py-10 text-center text-sm text-ink-soft/60">Aucun départ à venir.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[42rem] text-sm">
                    <thead className="bg-sand text-left text-xs font-medium uppercase tracking-wider text-ink-soft">
                      <tr className="border-b border-line">
                        <th className="px-6 py-3.5">Trajet</th>
                        <th className="px-6 py-3.5">Heure</th>
                        <th className="px-6 py-3.5 hidden sm:table-cell">Véhicule</th>
                        <th className="px-6 py-3.5">Places libres</th>
                        <th className="px-6 py-3.5" />
                      </tr>
                    </thead>
                    <tbody>
                      {todayDepartures.map((t: any) => {
                        const booked = t.tickets?.length ?? 0;
                        const ratio = t.seatsTotal ? booked / t.seatsTotal : 0;
                        return (
                          <tr
                            key={t.id}
                            onClick={() => router.push(`/${slug}/trips/${t.id}`)}
                            className="group cursor-pointer border-b border-line transition-colors last:border-0 hover:bg-ink/[.02]"
                          >
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
                  </table>
                </div>
              )}
            </ComponentCard>
          </div>

          {/* right rail */}
          <div className="col-span-12 space-y-4 md:space-y-6 xl:col-span-4">
            {/* quick actions */}
            <ComponentCard title="Actions rapides" desc="Créez et gérez en un clic.">
              <div className="flex flex-col gap-2.5">
                {quickActions.map((a) => (
                  <Button
                    key={a.href}
                    variant={a.primary ? "primary" : "outline"}
                    className="w-full justify-between"
                    onClick={() => router.push(a.href)}
                  >
                    <span className="inline-flex items-center gap-2.5">{a.icon} {a.label}</span>
                    <ChevronRight size={16} className="opacity-60" />
                  </Button>
                ))}
              </div>
            </ComponentCard>

            {/* recent activity */}
            <ComponentCard
              title="Activité récente"
              action={<History size={16} className="text-ink-soft/50" />}
            >
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
              <Button variant="outline" className="mt-6 w-full" onClick={() => router.push(`/${slug}/bookings`)}>
                Toutes les réservations <ArrowUpRight size={15} />
              </Button>
            </ComponentCard>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
