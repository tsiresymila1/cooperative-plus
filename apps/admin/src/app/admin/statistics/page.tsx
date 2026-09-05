"use client";
import { useMemo } from "react";
import { AdminShell } from "@/components/admin-shell";
import { Building2, Users, CalendarCheck, Route, MapPin, Globe } from "lucide-react";
import {
  adminNav,
  db,
  notDeleted,
  StatCard,
  DataTable,
  Badge,
  type Column,
} from "@cp/ui";

type Visit = {
  id: string;
  email?: string;
  ip?: string;
  city?: string;
  region?: string;
  country?: string;
  app?: string;
  lastSeenAt?: number;
};

const dateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export default function StatisticsPage() {
  const todayKey = dateKey(new Date());
  const { data, isLoading } = db.useQuery({
    $users: {},
    cooperatives: {},
    visits: {},
    tripInstances: { $: { where: { departDate: todayKey } } },
    bookings: { tripInstance: {} },
  });

  const now = Date.now();
  const m = useMemo(() => {
    const users = data?.$users ?? [];
    const coops = (data?.cooperatives ?? []).filter(notDeleted);
    const activeCoops = coops.filter(
      (c: any) => c.subscriptionStatus && c.subscriptionStatus !== "suspended" && c.subscriptionStatus !== "cancelled",
    );
    const tripsToday = (data?.tripInstances ?? []).filter((t: any) => t.status === "scheduled");
    // "Déjà voyagé" = passengers on trips that have already departed, on bookings
    // that were not cancelled/expired/refunded.
    const dead = ["cancelled", "expired", "refunded", "no_show"];
    const travelers = (data?.bookings ?? [])
      .filter((b: any) => !dead.includes(b.status))
      .filter((b: any) => b.tripInstance && +new Date(b.tripInstance.departureAt) < now)
      .reduce((sum: number, b: any) => sum + (b.seatCount ?? 1), 0);

    const visits = [...((data?.visits ?? []) as Visit[])].sort(
      (a, b) => (b.lastSeenAt ?? 0) - (a.lastSeenAt ?? 0),
    );
    return {
      users: users.length,
      coops: coops.length,
      activeCoops: activeCoops.length,
      tripsToday: tripsToday.length,
      travelers,
      tracked: visits.length,
      visits,
    };
  }, [data, now]);

  const v = (n: number) => (isLoading ? "—" : String(n));

  const stats = [
    { id: "users", icon: <Users size={22} />, label: "Utilisateurs de la plateforme", value: v(m.users), hint: `${v(m.tracked)} suivis (IP)`, tone: "ink" as const },
    { id: "coops", icon: <Building2 size={22} />, label: "Coopératives", value: v(m.coops), hint: `${v(m.activeCoops)} active(s)`, tone: "laterite" as const },
    { id: "trips", icon: <Route size={22} />, label: "Trajets aujourd'hui", value: v(m.tripsToday), hint: "Programmés ce jour", tone: "baobab" as const },
    { id: "trav", icon: <CalendarCheck size={22} />, label: "Voyageurs (déjà partis)", value: v(m.travelers), hint: "Places sur trajets passés", tone: "ink" as const },
  ];

  const columns: Column<Visit>[] = [
    { key: "email", header: "Utilisateur", render: (r) => <span className="font-medium text-ink">{r.email ?? "—"}</span> },
    { key: "ip", header: "Adresse IP", render: (r) => <span className="font-mono text-xs text-ink-soft">{r.ip ?? "—"}</span> },
    {
      key: "loc",
      header: "Localisation",
      render: (r) => (
        <span className="flex items-center gap-1.5 text-ink-soft">
          <MapPin size={13} className="text-laterite" />
          {[r.city, r.region, r.country].filter(Boolean).join(", ") || "—"}
        </span>
      ),
    },
    { key: "app", header: "Espace", render: (r) => (r.app ? <Badge>{r.app}</Badge> : <span className="text-ink-soft">—</span>) },
    {
      key: "seen",
      header: "Dernière visite",
      render: (r) => <span className="text-ink-soft">{r.lastSeenAt ? new Date(r.lastSeenAt).toLocaleString("fr") : "—"}</span>,
    },
  ];

  return (
    <AdminShell nav={adminNav("statistics")} title="Statistiques" subtitle="Fréquentation et activité de la plateforme">
      {/* KPI grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6">
        {stats.map((s) => (
          <StatCard key={s.id} icon={s.icon} label={s.label} value={s.value} hint={s.hint} tone={s.tone} />
        ))}
      </div>

      {/* Users with IP + location */}
      <section className="mt-4 md:mt-6">
        <div className="mb-3 flex items-center gap-2">
          <Globe size={16} className="text-ink-soft" />
          <h3 className="text-base font-medium text-ink">Utilisateurs & connexions</h3>
        </div>
        <DataTable
          columns={columns}
          rows={m.visits}
          loading={isLoading}
          pageSize={12}
          empty="Aucune connexion enregistrée pour l'instant."
        />
      </section>
    </AdminShell>
  );
}
