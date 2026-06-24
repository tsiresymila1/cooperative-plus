"use client";
import { AdminShell } from "@/components/admin-shell";
import { useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import {
  adminNav,
  db,
  id,
  tx,
  DataTable,
  FilterBar,
  Drawer,
  useConfirm,
  Button,
  TagBadge,
  Field,
  toast,
  notDeleted,
  type Column,
} from "@cp/ui";
import { Input } from "@cp/ui/shadcn";

type Tag = {
  id: string;
  name: string;
  color: string;
  isGlobal: boolean;
  createdAt: number | string;
};

const emptyForm = { name: "", color: "#0f2d5c" };

export default function TagsPage() {
  const { data, isLoading } = db.useQuery({ tags: { $: { where: { isGlobal: true } } } });
  const confirm = useConfirm();

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const rows = useMemo(() => {
    const list = (data?.tags ?? []).filter(notDeleted) as Tag[];
    const q = search.trim().toLowerCase();
    return q ? list.filter((t) => t.name.toLowerCase().includes(q)) : list;
  }, [data, search]);

  function openCreate() {
    setEditId(null);
    setForm(emptyForm);
    setOpen(true);
  }
  function openEdit(t: Tag) {
    setEditId(t.id);
    setForm({ name: t.name, color: t.color || "#0f2d5c" });
    setOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error("Le nom est requis.");
      return;
    }
    setSaving(true);
    try {
      const payload = { name: form.name.trim(), color: form.color };
      if (editId) {
        await db.transact(tx.tags[editId].update(payload));
        toast.success("Tag mis à jour.");
      } else {
        await db.transact(tx.tags[id()].update({ ...payload, isGlobal: true, createdAt: Date.now() }));
        toast.success("Tag global créé.");
      }
      setOpen(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Échec de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(t: Tag) {
    const ok = await confirm({
      title: "Supprimer le tag ?",
      message: `${t.name} sera retiré. Les trajets déjà taggés perdent ce tag.`,
      confirmLabel: "Supprimer",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await db.transact(tx.tags[t.id].update({ deletedAt: Date.now() }));
      toast.success("Tag supprimé.");
    } catch (e: any) {
      toast.error(e?.message ?? "Échec.");
    }
  }

  const columns: Column<Tag>[] = [
    { key: "badge", header: "Aperçu", render: (t) => <TagBadge name={t.name} color={t.color} /> },
    { key: "name", header: "Nom", render: (t) => <span className="font-medium text-ink">{t.name}</span> },
    {
      key: "color",
      header: "Couleur",
      render: (t) => <span className="font-mono text-xs text-ink-soft">{t.color}</span>,
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (t) => (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => openEdit(t)}>Modifier</Button>
          <Button variant="ghost" size="sm" className="text-danger hover:bg-danger/10" onClick={() => handleDelete(t)}>Supprimer</Button>
        </div>
      ),
    },
  ];

  return (
    <AdminShell
      nav={adminNav("tags")}
      title="Tags trajets"
      tenant="Plateforme"
      breadcrumb={
        <>
          <span>Plateforme</span>
          <ChevronRight size={12} />
          <span className="text-ink">Tags trajets</span>
        </>
      }
      action={<Button size="sm" onClick={openCreate}>Nouveau tag</Button>}
    >
      <FilterBar>
        <Input placeholder="Rechercher…" value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 max-w-xs" />
      </FilterBar>

      <DataTable columns={columns} rows={rows} loading={isLoading} empty="Aucun tag global. Créez-en un (Standard, Premium, VIP…)." />

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title={editId ? "Modifier le tag" : "Nouveau tag global"}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)} disabled={saving}>Annuler</Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? "…" : "Enregistrer"}</Button>
          </div>
        }
      >
        <div className="grid gap-4">
          <Field label="Nom">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Premium" />
          </Field>
          <Field label="Couleur">
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                className="h-9 w-12 cursor-pointer rounded border border-ink/15 bg-transparent p-0.5"
              />
              <Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="h-9 w-32 font-mono" />
              <TagBadge name={form.name || "Aperçu"} color={form.color} />
            </div>
          </Field>
        </div>
      </Drawer>
    </AdminShell>
  );
}
