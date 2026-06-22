"use client";
import { useRouter } from "next/navigation";
import { Plus, Route as RouteIcon, Pencil, Trash2, ArrowRight, ChevronRight } from "lucide-react";
import {
  DashboardShell,
  coopNav,
  useCoop,
  db,
  Button,
  Badge,
  DataTable,
  useConfirm,
  toast,
  type Column,
  fmtMoney,
  routeStatus,
  notDeleted,
} from "@cp/ui";

export default function RoutesPage() {
  const { coopId, slug, coop } = useCoop();
  const router = useRouter();
  const confirm = useConfirm();

  const { data, isLoading } = db.useQuery({
    routes: { $: { where: { "cooperative.id": coopId } }, origin: {}, destination: {}, tripInstances: {} },
  });

  const routes = (data?.routes ?? []).filter(notDeleted);

  const del = async (r: any) => {
    const attachedTrips = (r.tripInstances ?? []).filter(notDeleted);
    if (attachedTrips.length > 0) {
      toast.error("Impossible: des trajets sont attachés");
      return;
    }
    if (
      await confirm({
        title: "Supprimer cet itinéraire ?",
        message: r.name,
        confirmLabel: "Supprimer",
        tone: "danger",
      })
    ) {
      await db.transact(db.tx.routes[r.id].update({ deletedAt: Date.now() }));
      toast.success("Itinéraire supprimé");
    }
  };

  const columns: Column<any>[] = [
    {
      key: "name",
      header: "Nom",
      render: (r) => (
        <span className="inline-flex items-center gap-2 font-semibold text-ink">
          <RouteIcon size={15} className="text-ink-soft/60" /> {r.name}
        </span>
      ),
    },
    {
      key: "od",
      header: "Origine → Destination",
      render: (r) => (
        <span className="inline-flex items-center gap-1.5">
          {r.origin?.name ?? "?"} <ArrowRight size={13} className="text-ink-soft/50" /> {r.destination?.name ?? "?"}
        </span>
      ),
    },
    { key: "price", header: "Prix de base", render: (r) => fmtMoney(r.basePrice) },
    { key: "dist", header: "Distance", render: (r) => (r.distanceKm ? `${r.distanceKm} km` : "—") },
    { key: "dur", header: "Durée", render: (r) => (r.durationMin ? `${r.durationMin} min` : "—") },
    {
      key: "status",
      header: "Statut",
      render: (r) => {
        const s = routeStatus[r.status] ?? { label: r.status, tone: "neutral" as const };
        return <Badge tone={s.tone}>{s.label}</Badge>;
      },
    },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div className="flex justify-end gap-1">
          <Button size="sm" variant="ghost" onClick={() => router.push(`/${slug}/routes/${r.id}/edit`)}>
            <Pencil size={14} /> Modifier
          </Button>
          <Button size="sm" variant="ghost" onClick={() => del(r)}>
            <Trash2 size={14} /> Supprimer
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardShell
      nav={coopNav(slug, "routes")}
      title="Itinéraires"
      tenant={coop.displayName}
      logoUrl={coop.logoUrl}
      breadcrumb={
        <>
          <span>{coop.displayName}</span>
          <ChevronRight size={12} />
          <span className="text-ink">Itinéraires</span>
        </>
      }
      action={
        <Button size="sm" onClick={() => router.push(`/${slug}/routes/new`)}>
          <Plus size={16} /> Nouvel itinéraire
        </Button>
      }
    >
      <DataTable
        columns={columns}
        rows={routes}
        loading={isLoading}
        empty={
          <span className="inline-flex flex-col items-center gap-2 text-ink-soft/60">
            <RouteIcon size={28} className="text-ink-soft/30" />
            Aucun itinéraire.
          </span>
        }
      />
    </DashboardShell>
  );
}
