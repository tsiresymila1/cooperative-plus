"use client";
import { AdminShell } from "@/components/admin-shell";
import { useMemo, useState } from "react";
import { ChevronRight, Pencil, Trash2, Shield, ShieldOff } from "lucide-react";
import {
  adminNav,
  db,
  tx,
  useAdmin,
  DataTable,
  FilterBar,
  Drawer,
  Field,
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
  const [edit, setEdit] = useState<User | null>(null);
  const [form, setForm] = useState({ name: "", phone: "" });
  const [saving, setSaving] = useState(false);

  const openEdit = (u: User) => { setEdit(u); setForm({ name: u.name ?? "", phone: u.phone ?? "" }); };
  const saveEdit = async () => {
    if (!edit) return;
    setSaving(true);
    try {
      await db.transact(tx.$users[edit.id].update({ name: form.name || undefined, phone: form.phone || undefined }));
      toast.success("Utilisateur mis à jour.");
      setEdit(null);
    } catch (e: any) { toast.error(e?.message ?? "Échec."); }
    finally { setSaving(false); }
  };

  // $users can't be deleted (system entity) — revoke access: drop login + memberships.
  const handleDelete = async (u: User) => {
    if (u.id === myId) { toast.error("Vous ne pouvez pas supprimer votre propre compte."); return; }
    const ok = await confirm({
      title: "Supprimer cet utilisateur ?",
      message: `${u.email} — ses identifiants et adhésions seront supprimés, l'accès révoqué. Irréversible.`,
      confirmLabel: "Supprimer",
      tone: "danger",
    });
    if (!ok) return;
    try {
      const cred = await db.queryOnce({ credentials: { $: { where: { email: u.email } } } });
      const mem = await db.queryOnce({ memberships: { $: { where: { "user.id": u.id } } } });
      const txs: any[] = [];
      for (const c of cred.data?.credentials ?? []) txs.push(tx.credentials[c.id].delete());
      for (const m of mem.data?.memberships ?? []) txs.push(tx.memberships[m.id].delete());
      if (u.isPlatformAdmin) txs.push(tx.$users[u.id].update({ isPlatformAdmin: false }));
      if (txs.length) await db.transact(txs);
      toast.success("Utilisateur supprimé (accès révoqué).");
    } catch (e: any) { toast.error(e?.message ?? "Échec."); }
  };

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
        const isSelf = u.id === myId;
        return (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="sm" onClick={() => openEdit(u)}>
              <Pencil size={14} /> Modifier
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={isSelf && u.isPlatformAdmin}
              title={isSelf && u.isPlatformAdmin ? "Vous ne pouvez pas retirer votre propre accès" : undefined}
              onClick={() => handleToggle(u)}
            >
              {u.isPlatformAdmin ? <><ShieldOff size={14} /> Retirer admin</> : <><Shield size={14} /> Admin</>}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-danger hover:bg-danger/10"
              disabled={isSelf}
              title={isSelf ? "Vous ne pouvez pas supprimer votre propre compte" : undefined}
              onClick={() => handleDelete(u)}
            >
              <Trash2 size={14} />
            </Button>
          </div>
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

      <Drawer
        open={!!edit}
        onClose={() => setEdit(null)}
        eyebrow={edit?.email}
        title="Modifier l'utilisateur"
        width="max-w-md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setEdit(null)} disabled={saving}>Annuler</Button>
            <Button size="sm" onClick={saveEdit} disabled={saving}>{saving ? "…" : "Enregistrer"}</Button>
          </div>
        }
      >
        {edit && (
          <div className="grid gap-4">
            <Field label="Nom">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nom complet" />
            </Field>
            <Field label="Téléphone">
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="034 00 000 00" />
            </Field>
            <Field label="Email" hint="Non modifiable">
              <Input value={edit.email} disabled className="opacity-60" />
            </Field>
          </div>
        )}
      </Drawer>
    </AdminShell>
  );
}
