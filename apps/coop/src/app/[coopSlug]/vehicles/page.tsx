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
  Card,
  PageSkeleton,
  useConfirm,
  toast,
  vehicleStatus,
  vehicleTypeLabel,
  notDeleted,
} from "@cp/ui";

export default function VehiclesPage() {
  const { coopId, slug, coop, role, permissions, isPlatformAdmin } = useCoop();
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

  const seatsOf = (v: any) => {
    const active = (v.seatMaps ?? []).find((m: any) => m.isActive) ?? (v.seatMaps ?? [])[0];
    return active?.layout?.filter?.((c: any) => c.type === "seat").length ?? v.seatCount ?? 0;
  };

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
      {isLoading ? (
        <PageSkeleton />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {vehicles.map((v: any) => {
            const s = vehicleStatus[v.status] ?? { label: v.status, tone: "neutral" as const };
            return (
              <Card
                key={v.id}
                className="group flex flex-col overflow-hidden transition-colors hover:border-ink/15"
              >
                {/* banner */}
                <button
                  onClick={() => router.push(`/${slug}/vehicles/${v.id}/edit`)}
                  className="relative flex h-28 items-center justify-center bg-strong text-white/90"
                >
                  <Bus size={40} className="opacity-80 transition-transform group-hover:scale-110" />
                  <span className="absolute left-3 top-3"><Badge tone={s.tone}>{s.label}</Badge></span>
                </button>
                {/* body */}
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-display text-base font-bold text-ink">{v.name}</p>
                      <p className="text-xs font-medium text-ink-soft/70">{vehicleTypeLabel[v.type] ?? v.type}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-sm text-ink-soft">
                    <span className="inline-flex items-center gap-1.5"><Hash size={14} className="text-ink-soft/50" /><span className="font-mono">{v.registrationNo}</span></span>
                    <span className="inline-flex items-center gap-1.5"><Armchair size={14} className="text-ink-soft/50" />{seatsOf(v)} places</span>
                  </div>
                  <div className="mt-4 flex items-center gap-1 border-t border-ink/8 pt-3">
                    <Button size="sm" variant="ghost" className="flex-1" onClick={() => router.push(`/${slug}/vehicles/${v.id}/edit`)}>
                      <Pencil size={14} /> Modifier
                    </Button>
                    <Button size="sm" variant="ghost" className="text-danger hover:bg-danger/10" onClick={() => del(v)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}

          {/* add card */}
          <button
            onClick={() => router.push(`/${slug}/vehicles/new`)}
            className="flex min-h-[15rem] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-ink/15 text-ink-soft/70 transition-colors hover:border-laterite/50 hover:bg-laterite/[.04] hover:text-laterite"
          >
            <span className="grid h-12 w-12 place-items-center rounded-full bg-ink/[.05] text-ink-soft"><Plus size={22} /></span>
            <span className="font-display text-base font-bold text-ink">Ajouter un véhicule</span>
            <span className="max-w-[12rem] text-center text-xs text-ink-soft/60">Agrandissez votre flotte avec un nouveau véhicule.</span>
          </button>
        </div>
      )}
    </DashboardShell>
  );
}
