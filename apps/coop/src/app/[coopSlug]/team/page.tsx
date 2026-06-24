"use client";
import { useRouter } from "next/navigation";
import { UserPlus, Users, Settings2, Power, Trash2, ChevronRight } from "lucide-react";
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
  memberRole,
} from "@cp/ui";

export default function TeamPage() {
  const { coopId, slug, coop, role, permissions, isPlatformAdmin } = useCoop();
  const router = useRouter();
  const confirm = useConfirm();

  const { data, isLoading } = db.useQuery({
    memberships: { $: { where: { "cooperative.id": coopId } }, user: {} },
  });

  const members = data?.memberships ?? [];

  const remove = async (r: any) => {
    if (
      await confirm({
        title: "Retirer ce membre ?",
        message: r.user?.email,
        confirmLabel: "Retirer",
        tone: "danger",
      })
    ) {
      await db.transact(db.tx.memberships[r.id].delete());
      toast.success("Membre retiré");
    }
  };

  const columns: Column<any>[] = [
    {
      key: "name",
      header: "Membre",
      render: (r) => (
        <div>
          <p className="font-semibold text-ink">{r.user?.name ?? r.user?.email ?? "—"}</p>
          <p className="text-xs text-ink-soft/60">{r.user?.email}</p>
        </div>
      ),
    },
    { key: "role", header: "Rôle", render: (r) => memberRole[r.role] ?? r.role },
    {
      key: "status",
      header: "Statut",
      render: (r) => (
        <Badge tone={r.status === "active" ? "success" : "neutral"}>
          {r.status === "active" ? "actif" : "désactivé"}
        </Badge>
      ),
    },
    {
      key: "perms",
      header: "Permissions",
      render: (r) =>
        r.role === "owner" ? (
          <span className="text-xs text-ink-soft/60">Toutes</span>
        ) : (
          <span className="text-xs text-ink-soft">{(r.permissions ?? []).length} accordées</span>
        ),
    },
    {
      key: "actions",
      header: "",
      render: (r) =>
        r.role === "owner" ? null : (
          <div className="flex justify-end gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={async () => {
                await db.transact(
                  db.tx.memberships[r.id].update({
                    status: r.status === "active" ? "disabled" : "active",
                  }),
                );
                toast.success(r.status === "active" ? "Membre désactivé" : "Membre activé");
              }}
            >
              <Power size={14} /> {r.status === "active" ? "Désactiver" : "Activer"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => router.push(`/${slug}/team/${r.id}/permissions`)}>
              <Settings2 size={14} /> Permissions
            </Button>
            <Button size="sm" variant="ghost" onClick={() => remove(r)}>
              <Trash2 size={14} /> Retirer
            </Button>
          </div>
        ),
    },
  ];

  return (
    <DashboardShell
      nav={coopNav(slug, "team", { role, permissions, isPlatformAdmin })}
      title="Équipe"
      tenant={coop.displayName}
      logoUrl={coop.logoUrl}
      breadcrumb={
        <>
          <span>{coop.displayName}</span>
          <ChevronRight size={12} />
          <span className="text-ink">Équipe</span>
        </>
      }
      action={
        <Button size="sm" onClick={() => router.push(`/${slug}/team/new`)}>
          <UserPlus size={16} /> Ajouter un assistant
        </Button>
      }
    >
      <DataTable
        columns={columns}
        rows={members}
        loading={isLoading}
        empty={
          <span className="inline-flex flex-col items-center gap-2 text-ink-soft/60">
            <Users size={28} className="text-ink-soft/30" />
            Aucun membre.
          </span>
        }
      />
    </DashboardShell>
  );
}
