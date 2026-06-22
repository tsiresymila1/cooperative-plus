"use client";
import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { Building2, Wallet, CalendarCheck, Users, ArrowRight } from "lucide-react";
import { adminNav, db, Badge, fmtMoney, fmtDate, notDeleted, subStatus } from "@cp/ui";

function startOfTodayMs() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}
const ts = (x: any) => new Date(x).getTime();

export default function DashboardPage() {
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
  const recentCoops = [...coops].sort((a: any, b: any) => ts(b.createdAt) - ts(a.createdAt)).slice(0, 5);
  const recentBookings = [...bookings].sort((a: any, b: any) => ts(b.createdAt) - ts(a.createdAt)).slice(0, 5);

  const stats = [
    { id: "coops", icon: Building2, label: "Coopératives", value: v(String(coops.length)), hint: `${activeCount} active${activeCount > 1 ? "s" : ""}` },
    { id: "rev", icon: Wallet, label: "Revenu encaissé", value: v(fmtMoney(totalRevenue)), hint: "Tous paiements" },
    { id: "book", icon: CalendarCheck, label: "Réservations aujourd'hui", value: v(String(bookingsToday)), hint: "Depuis minuit" },
    { id: "users", icon: Users, label: "Utilisateurs", value: v(String(users.length)), hint: `${adminCount} admin(s)` },
  ];

  return (
    <AdminShell nav={adminNav("dashboard")} title="Vue d'ensemble">
      {/* KPI */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ id, icon: Icon, label, value, hint }) => (
          <div key={id} className="rounded-xl border border-ink/8 bg-paper p-5 shadow-[--shadow-card]">
            <div className="flex items-center gap-2 text-ink-soft">
              <Icon size={16} />
              <span className="text-[13px] font-medium">{label}</span>
            </div>
            <p className="mt-3 font-display text-3xl font-extrabold tabular-nums text-ink">{value}</p>
            <p className="mt-1 text-xs text-ink-soft/70">{hint}</p>
          </div>
        ))}
      </div>

      {/* Recent activity */}
      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <Panel title="Dernières coopératives" href="/admin/cooperatives" empty={!recentCoops.length} loading={isLoading}>
          {recentCoops.map((c: any) => {
            const meta = subStatus[c.subscriptionStatus];
            return (
              <Link
                key={c.id}
                href={`/admin/cooperatives/${c.id}/edit`}
                className="flex items-center gap-3 rounded-lg px-2.5 py-2.5 transition-colors hover:bg-ink/[.03]"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-laterite/10 text-laterite">
                  <Building2 size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{c.displayName}</p>
                  <p className="truncate text-xs text-ink-soft/60">{c.region ?? "—"} · {fmtDate(c.createdAt)}</p>
                </div>
                <Badge tone={meta?.tone ?? "neutral"}>{meta?.label ?? c.subscriptionStatus}</Badge>
              </Link>
            );
          })}
        </Panel>

        <Panel title="Dernières réservations" empty={!recentBookings.length} loading={isLoading}>
          {recentBookings.map((b: any) => (
            <div key={b.id} className="flex items-center gap-3 rounded-lg px-2.5 py-2.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-baobab/10 text-baobab">
                <CalendarCheck size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{b.contactName ?? b.reference ?? "Réservation"}</p>
                <p className="truncate text-xs text-ink-soft/60">{fmtDate(b.createdAt)}</p>
              </div>
              <span className="shrink-0 font-mono text-sm tabular-nums text-ink">{fmtMoney(b.totalAmount ?? 0)}</span>
            </div>
          ))}
        </Panel>
      </div>
    </AdminShell>
  );
}

function Panel({
  title,
  href,
  empty,
  loading,
  children,
}: {
  title: string;
  href?: string;
  empty: boolean;
  loading?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-ink/8 bg-paper p-4 shadow-[--shadow-card]">
      <div className="mb-2 flex items-center justify-between px-1">
        <h2 className="font-display text-base font-bold text-ink">{title}</h2>
        {href && (
          <Link href={href} className="flex items-center gap-1 text-xs font-medium text-ink-soft transition-colors hover:text-laterite">
            Tout voir <ArrowRight size={13} />
          </Link>
        )}
      </div>
      {loading ? (
        <p className="px-2.5 py-8 text-center text-sm text-ink-soft/50">Chargement…</p>
      ) : empty ? (
        <p className="px-2.5 py-8 text-center text-sm text-ink-soft/50">Aucune donnée.</p>
      ) : (
        <div className="flex flex-col">{children}</div>
      )}
    </section>
  );
}
