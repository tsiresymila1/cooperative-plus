"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, CalendarClock, Pencil, XCircle, Bus, ArrowRight, ExternalLink, ChevronRight, CalendarPlus, Users, Route as RouteIcon } from "lucide-react";
import {
  DashboardShell,
  coopNav,
  useCoop,
  db,
  Button,
  Badge,
  DataTable,
  FilterBar,
  KpiCard,
  useConfirm,
  toast,
  type Column,
  fmtMoney,
  fmtDateTime,
  fmtTime,
  tripStatus,
  notDeleted,
  todayISO,
} from "@cp/ui";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Input,
  DatePicker,
} from "@cp/ui/shadcn";

const STATUSES = ["scheduled", "boarding", "departed", "arrived", "cancelled"];
const statusBg: Record<string, string> = {
  scheduled: "bg-ink/5 text-ink-soft",
  boarding: "bg-clay/25 text-[#9a5a16]",
  departed: "bg-sky/15 text-sky",
  arrived: "bg-baobab/15 text-baobab",
  cancelled: "bg-danger/12 text-danger",
};
const dKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export default function TripsPage() {
  const { coopId, slug, coop, role, permissions, isPlatformAdmin } = useCoop();
  const router = useRouter();
  const confirm = useConfirm();
  const today = todayISO();

  const { data, isLoading } = db.useQuery({
    tripInstances: { $: { where: { "cooperative.id": coopId } }, route: {}, vehicle: {}, tickets: {} },
    routes: { $: { where: { "cooperative.id": coopId } }, origin: {}, destination: {} },
  });

  const routes = (data?.routes ?? []).filter(notDeleted);
  const allInstances = (data?.tripInstances ?? []).filter(notDeleted);

  const [search, setSearch] = useState("");
  const [statusF, setStatusF] = useState("all");
  const [routeF, setRouteF] = useState("all");
  const [from, setFrom] = useState(today); // default: from today onward
  const [to, setTo] = useState("");

  const rows = useMemo(() => {
    return allInstances
      .filter((t: any) => {
        if (statusF !== "all" && t.status !== statusF) return false;
        if (routeF !== "all" && t.route?.id !== routeF) return false;
        if (from && t.departDate < from) return false;
        if (to && t.departDate > to) return false;
        if (search) {
          const q = search.toLowerCase();
          if (
            !`${t.originName} ${t.destName} ${t.vehicleName} ${t.routeName}`
              .toLowerCase()
              .includes(q)
          )
            return false;
        }
        return true;
      })
      .sort((a: any, b: any) => new Date(a.departureAt).getTime() - new Date(b.departureAt).getTime());
  }, [allInstances, statusF, routeF, from, to, search]);

  const todayRows = useMemo(() => rows.filter((t: any) => t.departDate === today), [rows, today]);
  const otherRows = useMemo(() => rows.filter((t: any) => t.departDate !== today), [rows, today]);

  // KPI metrics (across all instances, not just filtered rows)
  const nowMs = Date.now();
  const upcoming = allInstances.filter((t: any) => new Date(t.departureAt).getTime() >= nowMs && t.status !== "cancelled");
  const enRoute = allInstances.filter((t: any) => t.status === "boarding" || t.status === "departed").length;
  const passengers = upcoming.reduce((s: number, t: any) => s + (t.tickets?.length ?? 0), 0);
  const kSeatsTotal = upcoming.reduce((s: number, t: any) => s + (t.seatsTotal ?? 0), 0);
  const kOcc = kSeatsTotal ? Math.round((passengers / kSeatsTotal) * 100) : 0;

  const setStatus = async (r: any, next: string) => {
    try { await db.transact(db.tx.tripInstances[r.id].update({ status: next })); toast.success("Statut mis à jour"); }
    catch (e: any) { toast.error("Erreur: " + (e?.message ?? "inconnue")); }
  };

  const cancel = async (r: any) => {
    if (
      await confirm({
        title: "Annuler ce trajet ?",
        message: `${r.originName} → ${r.destName} · ${fmtDateTime(r.departureAt)}`,
        confirmLabel: "Annuler le trajet",
        tone: "danger",
      })
    ) {
      await db.transact(db.tx.tripInstances[r.id].update({ status: "cancelled" }));
      toast.success("Trajet annulé");
    }
  };

  const actionsColumn: Column<any> = {
    key: "actions",
    header: "",
    render: (r) => (
      <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
        <Button size="sm" onClick={() => router.push(`/${slug}/trips/${r.id}`)}>
          <ExternalLink size={14} /> Ouvrir
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => router.push(`/${slug}/trips/${r.id}/edit`)}
        >
          <Pencil size={14} /> Modifier
        </Button>
        {r.status !== "cancelled" && (
          <Button size="sm" variant="ghost" onClick={() => cancel(r)}>
            <XCircle size={14} /> Annuler
          </Button>
        )}
      </div>
    ),
  };

  const statusColumn: Column<any> = {
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
  };

  const routeColumn: Column<any> = {
    key: "route",
    header: "Trajet",
    render: (r) => (
      <span className="inline-flex items-center gap-1.5 font-medium text-ink">
        {r.originName} <ArrowRight size={13} className="text-ink-soft/50" /> {r.destName}
      </span>
    ),
  };

  const vehicleColumn: Column<any> = {
    key: "vehicle",
    header: "Véhicule",
    render: (r) => (
      <span className="inline-flex items-center gap-1.5">
        <Bus size={14} className="text-ink-soft/60" /> {r.vehicleName}
      </span>
    ),
  };

  const seatsColumn: Column<any> = {
    key: "seats",
    header: "Places libres",
    render: (r) => {
      const booked = r.tickets?.length ?? 0;
      const total = r.seatsTotal ?? 0;
      const free = total - booked;
      const ratio = total ? booked / total : 0;
      const c = ratio >= 1 ? "bg-danger" : ratio >= 0.8 ? "bg-laterite" : "bg-success";
      return (
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-ink/[.08]">
            <div className={`h-full rounded-full ${c}`} style={{ width: `${Math.max(5, ratio * 100)}%` }} />
          </div>
          <span className="text-xs font-bold text-ink tabular-nums">{free}/{total}</span>
        </div>
      );
    },
  };

  // "Départs du jour" mirrors the dashboard departures table:
  // Heure, Trajet, Véhicule, Places, Statut + actions.
  const todayColumns: Column<any>[] = [
    {
      key: "time",
      header: "Heure",
      render: (r) => <span className="font-mono font-semibold text-ink">{fmtTime(r.departureAt)}</span>,
    },
    routeColumn,
    vehicleColumn,
    seatsColumn,
    statusColumn,
    actionsColumn,
  ];

  const columns: Column<any>[] = [
    { key: "date", header: "Départ", render: (r) => <span className="font-mono font-semibold text-ink">{fmtDateTime(r.departureAt)}</span>},
    routeColumn,
    vehicleColumn,
    { key: "price", header: "Prix", render: (r) => fmtMoney(r.price) },
    seatsColumn,
    statusColumn,
    actionsColumn,
  ];

  return (
    <DashboardShell
      nav={coopNav(slug, "trips", { role, permissions, isPlatformAdmin })}
      title="Planning des trajets"
      subtitle="Départs, occupation et statuts en temps réel."
      tenant={coop.displayName}
      logoUrl={coop.logoUrl}
      breadcrumb={
        <>
          <span>{coop.displayName}</span>
          <ChevronRight size={12} />
          <span className="text-ink">Trajets</span>
        </>
      }
      action={
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => router.push(`/${slug}/trips/schedule`)}>
            <CalendarClock size={16} /> Calendrier
          </Button>
          <Button size="sm" variant="outline" onClick={() => router.push(`/${slug}/trips/recurring`)}>
            <CalendarPlus size={16} /> Trajet récurrent
          </Button>
          <Button size="sm" onClick={() => router.push(`/${slug}/trips/new`)}>
            <Plus size={16} /> Nouveau trajet
          </Button>
        </div>
      }
    >
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Trajets à venir" value={String(upcoming.length)} icon={<CalendarClock size={18} />} />
        <KpiCard label="En circulation" value={String(enRoute)} icon={<RouteIcon size={18} />} pill={{ text: "embarquement / parti", tone: "neutral" }} />
        <KpiCard label="Passagers" value={String(passengers)} icon={<Users size={18} />} pill={{ text: "places réservées", tone: "neutral" }} />
        <KpiCard label="Occupation moyenne" value={`${kOcc}%`} progress={kOcc} />
      </div>

      <FilterBar>
        <Input
          placeholder="Rechercher…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-56"
        />
        <Select value={statusF} onValueChange={setStatusF}>
          <SelectTrigger className="h-9 w-44">
            <SelectValue placeholder="Tous les statuts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {tripStatus[s]?.label ?? s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={routeF} onValueChange={setRouteF}>
          <SelectTrigger className="h-9 w-52">
            <SelectValue placeholder="Tous les itinéraires" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les itinéraires</SelectItem>
            {routes.map((r: any) => (
              <SelectItem key={r.id} value={r.id}>
                {r.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DatePicker
          value={from ? new Date(from + "T00:00:00") : undefined}
          onChange={(d) => setFrom(d ? dKey(d) : "")}
          placeholder="Du"
          className="h-9 w-40"
        />
        <DatePicker
          value={to ? new Date(to + "T00:00:00") : undefined}
          onChange={(d) => setTo(d ? dKey(d) : "")}
          placeholder="Au"
          className="h-9 w-40"
        />
      </FilterBar>

      <section>
        <DataTable
          columns={columns}
          rows={rows}
          loading={isLoading}
          onRowClick={(r) => router.push(`/${slug}/trips/${r.id}`)}
          empty={
            <span className="inline-flex flex-col items-center gap-2 text-ink-soft/60">
              <CalendarClock size={28} className="text-ink-soft/30" />
              Aucun trajet pour ce filtre.
            </span>
          }
        />
      </section>
    </DashboardShell>
  );
}
