"use client";
import { AdminShell } from "@/components/admin-shell";
import { useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import {
  adminNav,
  db,
  tx,
  useAdmin,
  DataTable,
  FilterBar,
  useConfirm,
  Button,
  Badge,
  toast,
  type Column,
} from "@cp/ui";
import {
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@cp/ui/shadcn";

type User = {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  isPlatformAdmin?: boolean;
};

const FILTER_OPTIONS = [
  { value: "all", label: "Tous" },
  { value: "admins", label: "Administrateurs" },
  { value: "members", label: "Membres" },
];

export default function UsersPage() {
  const { userId: myId } = useAdmin();
  const { data, isLoading } = db.useQuery({ $users: {} });
  const confirm = useConfirm();

  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    const list = (data?.$users ?? []) as User[];
    const q = search.trim().toLowerCase();
    return list.filter((u) => {
      if (filter === "admins" && !u.isPlatformAdmin) return false;
      if (filter === "members" && u.isPlatformAdmin) return false;
      if (q) {
        const hay = `${u.email} ${u.name ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [data, filter, search]);

  async function handleToggle(target: User) {
    if (target.id === myId && target.isPlatformAdmin) {
      toast.error("Vous ne pouvez pas retirer votre propre accès administrateur.");
      return;
    }
    const ok = await confirm({
      title: target.isPlatformAdmin
        ? "Retirer les droits administrateur ?"
        : "Accorder les droits administrateur ?",
      message: target.isPlatformAdmin
        ? `${target.email} perdra l'accès à la console plateforme.`
        : `${target.email} aura un accès complet à la console plateforme.`,
      confirmLabel: target.isPlatformAdmin ? "Retirer" : "Promouvoir",
      tone: target.isPlatformAdmin ? "danger" : "default",
    });
    if (!ok) return;
    try {
      await db.transact(
        tx.$users[target.id].update({
          isPlatformAdmin: !target.isPlatformAdmin,
        }),
      );
      toast.success(
        target.isPlatformAdmin
          ? "Droits administrateur retirés."
          : "Droits administrateur accordés.",
      );
    } catch (e: any) {
      toast.error(e?.message ?? "Échec.");
    }
  }

  const columns: Column<User>[] = [
    {
      key: "user",
      header: "Utilisateur",
      render: (u) => (
        <div>
          <div className="font-medium text-ink">
            {u.name || <span className="text-ink-soft/50">Sans nom</span>}
            {u.id === myId && <span className="ml-2 text-xs text-ink-soft/60">(vous)</span>}
          </div>
          <div className="text-xs text-ink-soft/60">{u.email}</div>
        </div>
      ),
    },
    {
      key: "phone",
      header: "Téléphone",
      render: (u) => u.phone ?? <span className="text-ink-soft/40">—</span>,
    },
    {
      key: "role",
      header: "Rôle",
      render: (u) =>
        u.isPlatformAdmin ? (
          <Badge tone="success">administrateur</Badge>
        ) : (
          <Badge tone="neutral">membre</Badge>
        ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (u) => {
        const isSelfAdmin = u.id === myId && u.isPlatformAdmin;
        return (
          <Button
            variant={u.isPlatformAdmin ? "outline" : "ink"}
            size="sm"
            disabled={isSelfAdmin}
            title={isSelfAdmin ? "Vous ne pouvez pas retirer votre propre accès" : undefined}
            onClick={() => handleToggle(u)}
          >
            {u.isPlatformAdmin ? "Retirer admin" : "Promouvoir admin"}
          </Button>
        );
      },
    },
  ];

  return (
    <AdminShell
      nav={adminNav("users")}
      title="Utilisateurs"
      tenant="Plateforme"
      breadcrumb={
        <>
          <span>Plateforme</span>
          <ChevronRight size={12} />
          <span className="text-ink">Utilisateurs</span>
        </>
      }
    >
      <FilterBar>
        <Input
          placeholder="Rechercher par e-mail ou nom…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 max-w-xs"
        />
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="h-9 w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FILTER_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterBar>

      <DataTable columns={columns} rows={rows} loading={isLoading} empty="Aucun utilisateur." />
    </AdminShell>
  );
}
