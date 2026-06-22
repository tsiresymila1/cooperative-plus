"use client";
import { useRouter } from "next/navigation";
import { Plus, Bus, Pencil, Trash2, ChevronRight } from "lucide-react";
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
  vehicleStatus,
  vehicleTypeLabel,
  notDeleted,
} from "@cp/ui";

export default function VehiclesPage() {
  const { coopId, slug, coop } = useCoop();
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
      toast.success("Véhicule supprimé");
    }
  };

  const columns: Column<any>[] = [
    {
      key: "name",
      header: "Nom",
      render: (r) => (
        <span className="inline-flex items-center gap-2 font-semibold text-ink">
          <Bus size={15} className="text-ink-soft/60" /> {r.name}
        </span>
      ),
    },
    { key: "reg", header: "Immatriculation", render: (r) => <span className="font-mono">{r.registrationNo}</span> },
    { key: "type", header: "Type", render: (r) => vehicleTypeLabel[r.type] ?? r.type },
    { key: "seats", header: "Sièges", render: (r) => r.seatCount },
    {
      key: "status",
      header: "Statut",
      render: (r) => {
        const s = vehicleStatus[r.status] ?? { label: r.status, tone: "neutral" as const };
        return <Badge tone={s.tone}>{s.label}</Badge>;
      },
    },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="ghost" onClick={() => router.push(`/${slug}/vehicles/${r.id}/edit`)}>
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
      nav={coopNav(slug, "vehicles")}
      title="Véhicules"
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
        onRowClick={(r) => router.push(`/${slug}/vehicles/${r.id}/edit`)}
        empty={
          <span className="inline-flex flex-col items-center gap-2 text-ink-soft/60">
            <Bus size={28} className="text-ink-soft/30" />
            Aucun véhicule. Ajoutez-en un.
          </span>
        }
      />
    </DashboardShell>
  );
}
