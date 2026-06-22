"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, CalendarClock, Pencil, XCircle, Bus, ArrowRight, ExternalLink, ChevronRight, CalendarPlus } from "lucide-react";
import {
  DashboardShell,
  coopNav,
  useCoop,
  db,
  Button,
  Badge,
  DataTable,
  FilterBar,
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
  cancelled: "bg-[#e23b3b]/12 text-[#c42f2f]",
};
const dKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export default function TripsPage() {
  const { coopId, slug, coop } = useCoop();
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
  const [from, setFrom] = useState("");
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
      .sort((a: any, b: any) => new Date(b.departureAt).getTime() - new Date(a.departureAt).getTime());
  }, [allInstances, statusF, routeF, from, to, search]);

  const todayRows = useMemo(() => rows.filter((t: any) => t.departDate === today), [rows, today]);
  const otherRows = useMemo(() => rows.filter((t: any) => t.departDate !== today), [rows, today]);

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
    header: "Places",
    render: (r) => {
      const booked = r.tickets?.length ?? 0;
      const avail = (r.seatsTotal ?? 0) - booked;
      const tone = avail <= 0 ? "danger" : avail <= 3 ? "warning" : "success";
      return <Badge tone={tone}>{avail <= 0 ? "Complet" : `${booked}/${r.seatsTotal}`}</Badge>;
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
    { key: "date", header: "Départ", render: (r) => fmtDateTime(r.departureAt) },
    routeColumn,
    vehicleColumn,
    { key: "price", header: "Prix", render: (r) => fmtMoney(r.price) },
    seatsColumn,
    statusColumn,
    actionsColumn,
  ];

  return (
    <DashboardShell
      nav={coopNav(slug, "trips")}
      title="Trajets"
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
          <Button size="sm" variant="outline" onClick={() => router.push(`/${slug}/trips/recurring`)}>
            <CalendarPlus size={16} /> Trajet récurrent
          </Button>
          <Button size="sm" onClick={() => router.push(`/${slug}/trips/new`)}>
            <Plus size={16} /> Nouveau trajet
          </Button>
        </div>
      }
    >
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
        <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold text-ink">
          <CalendarClock size={18} className="text-laterite" /> Départs du jour
        </h2>
        <DataTable
          columns={todayColumns}
          rows={todayRows}
          loading={isLoading}
          onRowClick={(r) => router.push(`/${slug}/trips/${r.id}`)}
          empty={
            <span className="inline-flex flex-col items-center gap-2 text-ink-soft/60">
              <CalendarClock size={28} className="text-ink-soft/30" />
              Aucun départ aujourd'hui.
            </span>
          }
        />
      </section>

      <section className="mt-8">
        <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold text-ink">
          <Bus size={18} className="text-laterite" /> Tous les trajets
        </h2>
        <DataTable
          columns={columns}
          rows={otherRows}
          loading={isLoading}
          onRowClick={(r) => router.push(`/${slug}/trips/${r.id}`)}
          empty={
            <span className="inline-flex flex-col items-center gap-2 text-ink-soft/60">
              <CalendarClock size={28} className="text-ink-soft/30" />
              Aucun trajet. Créez-en un pour commencer.
            </span>
          }
        />
      </section>
    </DashboardShell>
  );
}
