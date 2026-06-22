"use client";
import { useRouter } from "next/navigation";
import { CalendarClock, Ticket } from "lucide-react";
import {
  DashboardShell,
  coopNav,
  useCoop,
  db,
  StatCard,
  DataTable,
  Badge,
  type Column,
  fmtMoney,
  fmtTime,
  fmtDateTime,
  todayISO,
  tripStatus,
  bookingStatus,
  notDeleted,
  toast,
} from "@cp/ui";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@cp/ui/shadcn";

const STATUSES = ["scheduled", "boarding", "departed", "arrived", "cancelled"];
const statusBg: Record<string, string> = {
  scheduled: "bg-ink/5 text-ink-soft",
  boarding: "bg-clay/25 text-[#9a5a16]",
  departed: "bg-sky/15 text-sky",
  arrived: "bg-baobab/15 text-baobab",
  cancelled: "bg-[#e23b3b]/12 text-[#c42f2f]",
};

export default function DashboardPage() {
  const { coopId, slug, coop } = useCoop();
  const router = useRouter();
  const today = todayISO();

  const { data, isLoading } = db.useQuery({
    tripInstances: {
      $: { where: { "cooperative.id": coopId } },
      tickets: {},
    },
    payments: {
      $: { where: { "cooperative.id": coopId, status: "paid" } },
    },
    bookings: {
      $: { where: { "cooperative.id": coopId }, order: { createdAt: "desc" }, limit: 8 },
      tripInstance: {},
    },
  });

  const instances = (data?.tripInstances ?? []).filter(notDeleted);
  const payments = data?.payments ?? [];
  const recentBookings = data?.bookings ?? [];

  const now = Date.now();
  const todayDepartures = instances
    .filter((t: any) => t.departDate === today && t.status !== "cancelled")
    .sort((a: any, b: any) => new Date(a.departureAt).getTime() - new Date(b.departureAt).getTime());

  const upcoming = instances.filter(
    (t: any) => new Date(t.departureAt).getTime() >= now && t.status !== "cancelled",
  );

  const seatsTotal = upcoming.reduce((s: number, t: any) => s + (t.seatsTotal ?? 0), 0);
  const seatsBooked = upcoming.reduce((s: number, t: any) => s + (t.tickets?.length ?? 0), 0);
  const occupancy = seatsTotal > 0 ? Math.round((seatsBooked / seatsTotal) * 100) : 0;

  const revenue = payments.reduce((s: number, p: any) => s + (p.amount ?? 0), 0);

  const setStatus = async (r: any, next: string) => {
    try { await db.transact(db.tx.tripInstances[r.id].update({ status: next })); toast.success("Statut mis à jour"); }
    catch (e: any) { toast.error("Erreur: " + (e?.message ?? "inconnue")); }
  };

  const columns: Column<any>[] = [
    {
      key: "time",
      header: "Heure",
      render: (r) => <span className="font-mono font-semibold text-ink">{fmtTime(r.departureAt)}</span>,
    },
    { key: "route", header: "Trajet", render: (r) => `${r.originName} → ${r.destName}` },
    { key: "vehicle", header: "Véhicule", render: (r) => r.vehicleName },
    {
      key: "seats",
      header: "Places",
      render: (r) => {
        const booked = r.tickets?.length ?? 0;
        const avail = (r.seatsTotal ?? 0) - booked;
        const tone = avail <= 0 ? "danger" : avail <= 3 ? "warning" : "success";
        return <Badge tone={tone}>{avail <= 0 ? "Complet" : `${booked}/${r.seatsTotal}`}</Badge>;
      },
    },
    {
      key: "status",
      header: "Statut",
      render: (r) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Select value={r.status} onValueChange={(v) => setStatus(r, v)}>
            <SelectTrigger className={`h-8 w-36 border-0 text-xs font-medium ${statusBg[r.status] ?? "bg-ink/5"}`}><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => <SelectItem key={s} value={s}>{tripStatus[s]?.label ?? s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      ),
    },
  ];

  const bookingColumns: Column<any>[] = [
    {
      key: "reference",
      header: "Référence",
      render: (r) => <span className="font-mono font-semibold text-ink">{r.reference}</span>,
    },
    { key: "passenger", header: "Passager", render: (r) => r.contactName ?? "—" },
    {
      key: "trip",
      header: "Trajet",
      render: (r) =>
        r.tripInstance ? `${r.tripInstance.originName} → ${r.tripInstance.destName}` : "—",
    },
    {
      key: "amount",
      header: "Montant",
      render: (r) => <span className="tabular-nums">{fmtMoney(r.totalAmount)}</span>,
    },
    {
      key: "status",
      header: "Statut",
      render: (r) => {
        const s = bookingStatus[r.status] ?? { label: r.status, tone: "neutral" as const };
        return <Badge tone={s.tone}>{s.label}</Badge>;
      },
    },
    {
      key: "date",
      header: "Date",
      render: (r) => <span className="text-ink-soft">{fmtDateTime(r.createdAt)}</span>,
    },
  ];

  return (
    <DashboardShell nav={coopNav(slug, "dashboard")} title="Tableau de bord" tenant={coop.displayName} logoUrl={coop.logoUrl}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Départs aujourd'hui" value={String(todayDepartures.length)} tone="laterite" />
        <StatCard
          label="Taux d'occupation"
          value={`${occupancy}%`}
          hint="trajets à venir"
          tone="baobab"
        />
        <StatCard label="Revenus encaissés" value={fmtMoney(revenue)} hint="paiements payés" />
        <StatCard label="Trajets à venir" value={String(upcoming.length)} />
      </div>

      <div className="mt-8">
        <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold text-ink">
          <CalendarClock size={18} className="text-laterite" /> Départs du jour
        </h2>
        <DataTable
          columns={columns}
          rows={todayDepartures}
          loading={isLoading}
          onRowClick={(r) => router.push(`/${slug}/trips/${r.id}`)}
          empty="Aucun départ prévu aujourd'hui."
        />
      </div>

      <div className="mt-8">
        <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold text-ink">
          <Ticket size={18} className="text-laterite" /> Réservations récentes
        </h2>
        <DataTable
          columns={bookingColumns}
          rows={recentBookings}
          loading={isLoading}
          onRowClick={(r) => router.push(`/${slug}/bookings/${r.id}`)}
          empty="Aucune réservation récente."
        />
      </div>
    </DashboardShell>
  );
}
