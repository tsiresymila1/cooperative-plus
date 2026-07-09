"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, MapPin, Pencil, Trash2, ChevronRight, Check } from "lucide-react";
import {
  DashboardShell,
  coopNav,
  useCoop,
  db,
  Button,
  Badge,
  Card,
  DataTable,
  useConfirm,
  toast,
  logActivity,
  type Column,
  notDeleted,
} from "@cp/ui";

export default function DestinationsPage() {
  const { coopId, userId, slug, coop, role, permissions, isPlatformAdmin } = useCoop();
  const router = useRouter();
  const confirm = useConfirm();

  const { data, isLoading } = db.useQuery({
    destinations: { $: {}, cooperative: {} },
    cooperatives: { $: { where: { id: coopId } }, enabledDestinations: {} },
  });

  const all = (data?.destinations ?? []).filter(notDeleted);

  const enabledIds = useMemo(() => {
    const list = data?.cooperatives?.[0]?.enabledDestinations ?? [];
    return new Set(list.map((d: any) => d.id));
  }, [data]);

  // Private (coop-owned) destinations.
  const privateRows = useMemo(() => {
    return all
      .filter((d: any) => !d.isGlobal && d.cooperative?.id === coopId)
      .map((d: any) => ({ ...d, isMine: true }));
  }, [all, coopId]);

  // All global destinations (any coop can opt in).
  const globalRows = useMemo(() => {
    return all
      .filter((d: any) => d.isGlobal)
      .sort((a: any, b: any) => String(a.name).localeCompare(String(b.name)));
  }, [all]);

  const del = async (r: any) => {
    if (
      await confirm({
        title: "Supprimer cette destination ?",
        message: r.name,
        confirmLabel: "Supprimer",
        tone: "danger",
      })
    ) {
      await db.transact(db.tx.destinations[r.id].update({ deletedAt: Date.now() }));
      logActivity({ coopId, actorId: userId, action: "delete", entityType: "destination", entityId: r.id, label: r.name });
      toast.success("Destination supprimée");
    }
  };

  const toggleGlobal = async (destId: string, enabled: boolean) => {
    try {
      if (enabled) {
        await db.transact(db.tx.cooperatives[coopId].unlink({ enabledDestinations: destId }));
        toast.success("Destination retirée");
      } else {
        await db.transact(db.tx.cooperatives[coopId].link({ enabledDestinations: destId }));
        toast.success("Destination activée");
      }
    } catch (e: any) {
      toast.error("Erreur: " + (e?.message ?? "inconnue"));
    }
  };

  const privateColumns: Column<any>[] = [
    {
      key: "name",
      header: "Nom",
      render: (r) => (
        <span className="inline-flex items-center gap-2 font-semibold text-ink">
          <MapPin size={15} className="text-ink-soft/60" /> {r.name}
        </span>
      ),
    },
    {
      key: "slug",
      header: "Slug",
      render: (r) => <span className="font-mono text-xs text-ink-soft/60">{r.slug ?? "—"}</span>,
    },
    { key: "region", header: "Région", render: (r) => r.region ?? "—" },
    { key: "country", header: "Pays", render: (r) => r.country },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div className="flex justify-end gap-1">
          <Button size="sm" variant="ghost" onClick={() => router.push(`/${slug}/destinations/${r.id}/edit`)}>
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
      nav={coopNav(slug, "destinations", { role, permissions, isPlatformAdmin })}
      title="Destinations"
      tenant={coop.displayName}
      logoUrl={coop.logoUrl}
      breadcrumb={
        <>
          <span>{coop.displayName}</span>
          <ChevronRight size={12} />
          <span className="text-ink">Destinations</span>
        </>
      }
      action={
        <Button size="sm" onClick={() => router.push(`/${slug}/destinations/new`)}>
          <Plus size={16} /> Nouvelle destination
        </Button>
      }
    >
      <div className="grid gap-8">
        <section>
          <div className="mb-3 flex items-center gap-2">
            <h2 className="font-display text-lg font-bold text-ink">Mes destinations</h2>
            <Badge tone="success">Privées</Badge>
          </div>
          <DataTable
            columns={privateColumns}
            rows={privateRows}
            loading={isLoading}
            empty={
              <span className="inline-flex flex-col items-center gap-2 text-ink-soft/60">
                <MapPin size={28} className="text-ink-soft/30" />
                Aucune destination privée.
              </span>
            }
          />
        </section>

        <section>
          <div className="mb-3 flex items-center gap-2">
            <h2 className="font-display text-lg font-bold text-ink">Destinations globales</h2>
            <Badge tone="neutral">Plateforme</Badge>
          </div>
          <p className="mb-4 text-sm text-ink-soft">
            Activez les destinations partagées que votre coopérative dessert.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {globalRows.map((d: any) => {
              const enabled = enabledIds.has(d.id);
              return (
                <Card key={d.id} className="flex flex-col gap-3 p-4">
                  <div>
                    <span className="inline-flex items-center gap-2 font-semibold text-ink">
                      <MapPin size={15} className="text-ink-soft/60" /> {d.name}
                    </span>
                    <p className="mt-1 font-mono text-xs text-ink-soft/60">{d.slug ?? "—"}</p>
                    <p className="text-sm text-ink-soft">{d.region ?? "—"}</p>
                  </div>
                  <Button
                    size="sm"
                    variant={enabled ? "primary" : "outline"}
                    className="self-start"
                    onClick={() => toggleGlobal(d.id, enabled)}
                  >
                    {enabled ? (
                      <>
                        <Check size={14} /> Utilisée
                      </>
                    ) : (
                      "Utiliser"
                    )}
                  </Button>
                </Card>
              );
            })}
            {!isLoading && globalRows.length === 0 && (
              <p className="text-sm text-ink-soft/60">Aucune destination globale.</p>
            )}
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
