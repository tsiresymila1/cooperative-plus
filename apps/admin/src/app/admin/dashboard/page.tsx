"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { Building2, Wallet, CalendarCheck, Users, ArrowRight } from "lucide-react";
import {
  adminNav,
  db,
  Badge,
  Button,
  StatCard,
  DataTable,
  fmtMoney,
  fmtDate,
  notDeleted,
  subStatus,
  type Column,
} from "@cp/ui";

function startOfTodayMs() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}
const ts = (x: any) => new Date(x).getTime();

type CoopRow = { id: string; displayName: string; region?: string; subscriptionStatus: string; createdAt: number | string };
type BookingRow = { id: string; contactName?: string; reference?: string; totalAmount?: number; createdAt: number | string };

export default function DashboardPage() {
  const router = useRouter();
  const { data, isLoading } = db.useQuery({
    cooperatives: {},
    $users: {},
    payments: { $: { where: { status: { $in: ["paid", "succeeded"] } } } },
    bookings: {},
  });

  const coops = (data?.cooperatives ?? []).filter(notDeleted);
  const users = data?.$users ?? [];
  const payments = data?.payments ?? [];
  const bookings = (data?.bookings ?? []).filter(notDeleted);

  const todayStart = startOfTodayMs();
  const bookingsToday = bookings.filter((b: any) => ts(b.createdAt) >= todayStart).length;
  const totalRevenue = payments.reduce((s: number, p: any) => s + (p.amount ?? 0), 0);
  const activeCount = coops.filter((c: any) => c.subscriptionStatus === "active").length;
  const adminCount = users.filter((u: any) => u.isPlatformAdmin).length;

  const v = (x: string) => (isLoading ? "—" : x);
  const recentCoops = [...coops].sort((a: any, b: any) => ts(b.createdAt) - ts(a.createdAt)).slice(0, 5) as CoopRow[];
  const recentBookings = [...bookings].sort((a: any, b: any) => ts(b.createdAt) - ts(a.createdAt)).slice(0, 5) as BookingRow[];

  const stats = [
    { id: "coops", icon: <Building2 size={22} />, label: "Coopératives", value: v(String(coops.length)), hint: `${activeCount} active${activeCount > 1 ? "s" : ""}`, tone: "ink" as const },
    { id: "rev", icon: <Wallet size={22} />, label: "Revenu encaissé", value: v(fmtMoney(totalRevenue)), hint: "Tous paiements", tone: "laterite" as const },
    { id: "book", icon: <CalendarCheck size={22} />, label: "Réservations aujourd'hui", value: v(String(bookingsToday)), hint: "Depuis minuit", tone: "baobab" as const },
    { id: "users", icon: <Users size={22} />, label: "Utilisateurs", value: v(String(users.length)), hint: `${adminCount} admin(s)`, tone: "ink" as const },
  ];

  const coopColumns: Column<CoopRow>[] = [
    {
      key: "name",
      header: "Coopérative",
      render: (c) => (
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-laterite/10 text-laterite">
            <Building2 size={16} />
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium text-ink">{c.displayName}</p>
            <p className="truncate text-xs text-ink-soft/60">{c.region ?? "—"} · {fmtDate(c.createdAt)}</p>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Statut",
      className: "text-right",
      render: (c) => {
        const meta = subStatus[c.subscriptionStatus];
        return <Badge tone={meta?.tone ?? "neutral"}>{meta?.label ?? c.subscriptionStatus}</Badge>;
      },
    },
  ];

  const bookingColumns: Column<BookingRow>[] = [
    {
      key: "booking",
      header: "Réservation",
      render: (b) => (
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-baobab/10 text-baobab">
            <CalendarCheck size={16} />
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium text-ink">{b.contactName ?? b.reference ?? "Réservation"}</p>
            <p className="truncate text-xs text-ink-soft/60">{fmtDate(b.createdAt)}</p>
          </div>
        </div>
      ),
    },
    {
      key: "amount",
      header: "Montant",
      className: "text-right",
      render: (b) => <span className="font-mono tabular-nums text-ink">{fmtMoney(b.totalAmount ?? 0)}</span>,
    },
  ];

  return (
    <AdminShell nav={adminNav("dashboard")} title="Vue d'ensemble">
      {/* KPI metric grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6">
        {stats.map((s) => (
          <StatCard key={s.id} icon={s.icon} label={s.label} value={s.value} hint={s.hint} tone={s.tone} />
        ))}
      </div>

      {/* Recent activity */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2 md:mt-6 md:gap-6">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-medium text-ink">Dernières coopératives</h3>
            <Link href="/admin/cooperatives">
              <Button variant="ghost" size="sm">Tout voir <ArrowRight size={14} /></Button>
            </Link>
          </div>
          <DataTable
            columns={coopColumns}
            rows={recentCoops}
            loading={isLoading}
            pageSize={5}
            empty="Aucune coopérative."
            onRowClick={(c) => router.push(`/admin/cooperatives/${c.id}/edit`)}
          />
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-medium text-ink">Dernières réservations</h3>
          </div>
          <DataTable
            columns={bookingColumns}
            rows={recentBookings}
            loading={isLoading}
            pageSize={5}
            empty="Aucune réservation."
          />
        </section>
      </div>
    </AdminShell>
  );
}
