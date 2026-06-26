"use client";
import { useMemo, useState } from "react";
import { Plus, IdCard, ChevronRight, Phone } from "lucide-react";
import {
  DashboardShell,
  coopNav,
  useCoop,
  db,
  id,
  Button,
  Badge,
  Drawer,
  Field,
  ImageUpload,
  DataTable,
  useConfirm,
  toast,
  notDeleted,
  type Column,
} from "@cp/ui";
import { Input } from "@cp/ui/shadcn";

const empty = { name: "", licenseNo: "", phone: "", address: "", avatarUrl: "" };

export default function DriversPage() {
  const { coopId, slug, coop, role, permissions, isPlatformAdmin } = useCoop();
  const confirm = useConfirm();

  const { data, isLoading } = db.useQuery({ drivers: { $: { where: { "cooperative.id": coopId } } } });
  const drivers = useMemo(() => (data?.drivers ?? []).filter(notDeleted), [data]);

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  function openCreate() { setEditId(null); setForm(empty); setOpen(true); }
  function openEdit(d: any) {
    setEditId(d.id);
    setForm({ name: d.name ?? "", licenseNo: d.licenseNo ?? "", phone: d.phone ?? "", address: d.address ?? "", avatarUrl: d.avatarUrl ?? "" });
    setOpen(true);
  }

  async function onAvatar(file: File) {
    try {
      const res = await db.storage.uploadFile(`coops/${coopId}/drivers/${Date.now()}-${file.name}`, file);
      const q = await db.queryOnce({ $files: { $: { where: { id: (res as any).data.id } } } });
      const url = q.data?.$files?.[0]?.url;
      if (url) set("avatarUrl", url);
    } catch (e: any) {
      toast.error(e?.message ?? "Échec de l'upload.");
    }
  }

  async function save() {
    if (!form.name.trim()) { toast.error("Le nom est requis."); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        licenseNo: form.licenseNo.trim() || undefined,
        phone: form.phone.trim() || undefined,
        address: form.address.trim() || undefined,
        avatarUrl: form.avatarUrl || undefined,
        status: "active",
      };
      if (editId) {
        await db.transact(db.tx.drivers[editId].update(payload));
        toast.success("Chauffeur mis à jour.");
      } else {
        await db.transact(db.tx.drivers[id()].update({ ...payload, createdAt: Date.now() }).link({ cooperative: coopId }));
        toast.success("Chauffeur ajouté.");
      }
      setOpen(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Échec.");
    } finally {
      setSaving(false);
    }
  }

  async function del(d: any) {
    if (await confirm({ title: "Supprimer le chauffeur ?", message: d.name, confirmLabel: "Supprimer", tone: "danger" })) {
      await db.transact(db.tx.drivers[d.id].update({ deletedAt: Date.now() }));
      toast.success("Chauffeur supprimé.");
    }
  }

  const columns: Column<any>[] = [
    {
      key: "name",
      header: "Chauffeur",
      render: (d) => (
        <div className="flex items-center gap-3">
          {d.avatarUrl
            ? <img src={d.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
            : <span className="grid h-9 w-9 place-items-center rounded-full bg-strong text-xs font-bold text-white">{(d.name?.[0] ?? "?").toUpperCase()}</span>}
          <div>
            <p className="font-medium text-ink">{d.name}</p>
            <p className="font-mono text-xs text-ink-soft/60">{d.licenseNo ?? "—"}</p>
          </div>
        </div>
      ),
    },
    { key: "phone", header: "Contact", render: (d) => d.phone ? <span className="inline-flex items-center gap-1.5 text-ink-soft"><Phone size={13} /> {d.phone}</span> : "—" },
    { key: "address", header: "Adresse", render: (d) => <span className="text-ink-soft">{d.address ?? "—"}</span> },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (d) => (
        <div className="flex justify-end gap-1">
          <Button size="sm" variant="ghost" onClick={() => openEdit(d)}>Modifier</Button>
          <Button size="sm" variant="ghost" className="text-danger hover:bg-danger/10" onClick={() => del(d)}>Supprimer</Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardShell
      nav={coopNav(slug, "drivers", { role, permissions, isPlatformAdmin })}
      title="Chauffeurs"
      subtitle="Vos chauffeurs — assignables à un trajet jusqu'au départ."
      tenant={coop.displayName}
      logoUrl={coop.logoUrl}
      breadcrumb={<><span>{coop.displayName}</span><ChevronRight size={12} /><span className="text-ink">Chauffeurs</span></>}
      action={<Button size="sm" onClick={openCreate}><Plus size={16} /> Nouveau chauffeur</Button>}
    >
      <DataTable
        columns={columns}
        rows={drivers}
        loading={isLoading}
        empty={<span className="inline-flex flex-col items-center gap-2 text-ink-soft/60"><IdCard size={28} className="text-ink-soft/30" /> Aucun chauffeur.</span>}
      />

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title={editId ? "Modifier le chauffeur" : "Nouveau chauffeur"}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)} disabled={saving}>Annuler</Button>
            <Button size="sm" onClick={save} disabled={saving}>{saving ? "…" : "Enregistrer"}</Button>
          </div>
        }
      >
        <div className="grid gap-4">
          <Field label="Photo">
            <ImageUpload value={form.avatarUrl} onFile={onAvatar} hint="Avatar du chauffeur (optionnel)." />
          </Field>
          <Field label="Nom complet"><Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Rakoto Jean" /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="N° de permis"><Input value={form.licenseNo} onChange={(e) => set("licenseNo", e.target.value)} placeholder="123456 A" /></Field>
            <Field label="Téléphone"><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="034 00 000 00" /></Field>
          </div>
          <Field label="Adresse"><Input value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Lot II… Antananarivo" /></Field>
        </div>
      </Drawer>
    </DashboardShell>
  );
}
