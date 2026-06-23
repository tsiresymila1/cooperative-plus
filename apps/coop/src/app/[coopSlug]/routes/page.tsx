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
  KpiCard,
  useConfirm,
  toast,
  type Column,
  fmtMoney,
  routeStatus,
  notDeleted,
} from "@cp/ui";

export default function RoutesPage() {
  const { coopId, slug, coop, role, permissions, isPlatformAdmin } = useCoop();
  const router = useRouter();
  const confirm = useConfirm();

  const { data, isLoading } = db.useQuery({
    routes: { $: { where: { "cooperative.id": coopId } }, origin: {}, destination: {}, tripInstances: {} },
  });

  const routes = (data?.routes ?? []).filter(notDeleted);
  const activeCount = routes.filter((r: any) => r.status === "active").length;
  const linkedTrips = routes.reduce((s: number, r: any) => s + (r.tripInstances ?? []).filter(notDeleted).length, 0);
  const avgPrice = routes.length ? Math.round(routes.reduce((s: number, r: any) => s + (r.basePrice ?? 0), 0) / routes.length) : 0;

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
      header: "Itinéraire",
      render: (r) => (
        <span className="inline-flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-strong text-white"><RouteIcon size={16} /></span>
          <span className="font-semibold text-ink">{r.name}</span>
        </span>
      ),
    },
    {
      key: "od",
      header: "Origine → Destination",
      render: (r) => (
        <span className="inline-flex items-center gap-2">
          <span className="rounded-md bg-ink/[.05] px-2 py-0.5 text-xs font-medium text-ink">{r.origin?.name ?? "?"}</span>
          <ArrowRight size={13} className="text-laterite" />
          <span className="rounded-md bg-laterite/10 px-2 py-0.5 text-xs font-medium text-laterite-deep">{r.destination?.name ?? "?"}</span>
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
      nav={coopNav(slug, "routes", { role, permissions, isPlatformAdmin })}
      title="Itinéraires"
      subtitle="Réseau, tarifs et performance des lignes."
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
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total itinéraires" value={String(routes.length)} icon={<RouteIcon size={18} />} />
        <KpiCard label="Actifs" value={String(activeCount)} pill={{ text: "en service", tone: "neutral" }} />
        <KpiCard label="Trajets liés" value={String(linkedTrips)} icon={<ArrowRight size={18} />} />
        <KpiCard label="Prix moyen" value={fmtMoney(avgPrice)} />
      </div>

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
