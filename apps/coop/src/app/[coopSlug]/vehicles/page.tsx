"use client";
import { useRouter } from "next/navigation";
import { Plus, Bus, Pencil, Trash2, ChevronRight, Armchair, Hash } from "lucide-react";
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
  vehicleStatus,
  vehicleTypeLabel,
  notDeleted,
  logActivity,
  type Column,
} from "@cp/ui";

export default function VehiclesPage() {
  const { coopId, slug, coop, role, permissions, isPlatformAdmin, userId } = useCoop();
  const router = useRouter();
  const confirm = useConfirm();

  const { data, isLoading } = db.useQuery({
    vehicles: { $: { where: { "cooperative.id": coopId } }, seatMaps: {} },
  });

  const vehicles = (data?.vehicles ?? []).filter(notDeleted);

  const del = async (r: any) => {
    if (
      await confirm({
        title: "Supprimer ce véhicule ?",
        message: `${r.name} (${r.registrationNo})`,
        confirmLabel: "Supprimer",
        tone: "danger",
      })
    ) {
      await db.transact(db.tx.vehicles[r.id].update({ deletedAt: Date.now() }));
      logActivity({ coopId, actorId: userId, action: "delete", entityType: "vehicle", entityId: r.id, label: r.name || r.registrationNo });
      toast.success("Véhicule supprimé");
    }
  };

  const seatsOf = (v: any) => {
    const active = (v.seatMaps ?? []).find((m: any) => m.isActive) ?? (v.seatMaps ?? [])[0];
    return active?.layout?.filter?.((c: any) => c.type === "seat").length ?? v.seatCount ?? 0;
  };

  const columns: Column<any>[] = [
    {
      key: "name",
      header: "Véhicule",
      render: (v) => (
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-strong text-white">
            <Bus size={16} />
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-ink">{v.name}</p>
            <p className="text-xs font-medium text-ink-soft/70">{vehicleTypeLabel[v.type] ?? v.type}</p>
          </div>
        </div>
      ),
    },
    {
      key: "reg",
      header: "Immatriculation",
      render: (v) => (
        <span className="inline-flex items-center gap-1.5 text-ink-soft">
          <Hash size={14} className="text-ink-soft/50" />
          <span className="font-mono">{v.registrationNo}</span>
        </span>
      ),
    },
    {
      key: "seats",
      header: "Places",
      render: (v) => (
        <span className="inline-flex items-center gap-1.5 text-ink-soft">
          <Armchair size={14} className="text-ink-soft/50" /> {seatsOf(v)} places
        </span>
      ),
    },
    {
      key: "status",
      header: "Statut",
      render: (v) => {
        const s = vehicleStatus[v.status] ?? { label: v.status, tone: "neutral" as const };
        return <Badge tone={s.tone}>{s.label}</Badge>;
      },
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (v) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="ghost" onClick={() => router.push(`/${slug}/vehicles/${v.id}/edit`)}>
            <Pencil size={14} /> Modifier
          </Button>
          <Button size="sm" variant="ghost" className="text-danger hover:bg-danger/10" onClick={() => del(v)}>
            <Trash2 size={14} /> Supprimer
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardShell
      nav={coopNav(slug, "vehicles", { role, permissions, isPlatformAdmin })}
      title="Flotte"
      subtitle={`${vehicles.length} véhicule${vehicles.length > 1 ? "s" : ""} dans votre coopérative.`}
      tenant={coop.displayName}
      logoUrl={coop.logoUrl}
      breadcrumb={
        <>
          <span>{coop.displayName}</span>
          <ChevronRight size={12} />
          <span className="text-ink">Véhicules</span>
        </>
      }
      action={
        <Button size="sm" onClick={() => router.push(`/${slug}/vehicles/new`)}>
          <Plus size={16} /> Nouveau véhicule
        </Button>
      }
    >
      <DataTable
        columns={columns}
        rows={vehicles}
        loading={isLoading}
        onRowClick={(v) => router.push(`/${slug}/vehicles/${v.id}/edit`)}
        empty={
          <span className="inline-flex flex-col items-center gap-2 text-ink-soft/60">
            <Bus size={28} className="text-ink-soft/30" />
            Aucun véhicule.
          </span>
        }
      />
    </DashboardShell>
  );
}
