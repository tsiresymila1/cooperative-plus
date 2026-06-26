"use client";
import { useMemo, useState } from "react";
import { Plus, CarFront, ChevronRight } from "lucide-react";
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
  DataTable,
  SeatEditor,
  buildLayout,
  useConfirm,
  toast,
  notDeleted,
  toInt,
  type Cell,
  type Column,
} from "@cp/ui";
import { Input } from "@cp/ui/shadcn";

const FREE_TRIAL_MAX = 3;

export default function ModelsPage() {
  const { coopId, slug, coop, role, permissions, isPlatformAdmin } = useCoop();
  const confirm = useConfirm();

  const { data, isLoading } = db.useQuery({ vehicleModels: { $: { where: { "cooperative.id": coopId } } } });
  const models = useMemo(() => (data?.vehicleModels ?? []).filter(notDeleted), [data]);

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", brand: "", type: "minibus", rows: "5", cols: "4" });
  const [layout, setLayout] = useState<Cell[]>(() => buildLayout(5, 4));
  const [saving, setSaving] = useState(false);
  const seats = layout.filter((c) => c.type === "seat").length;
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const regen = () => setLayout(buildLayout(toInt(form.rows, 5), toInt(form.cols, 4)));

  function openCreate() {
    setEditId(null);
    setForm({ name: "", brand: "", type: "minibus", rows: "5", cols: "4" });
    setLayout(buildLayout(5, 4));
    setOpen(true);
  }
  function openEdit(m: any) {
    setEditId(m.id);
    setForm({ name: m.name ?? "", brand: m.brand ?? "", type: m.type ?? "minibus", rows: "5", cols: "4" });
    setLayout(Array.isArray(m.layout) && m.layout.length ? (m.layout as Cell[]) : buildLayout(5, 4));
    setOpen(true);
  }

  async function save() {
    if (!form.name.trim()) { toast.error("Le nom du modèle est requis."); return; }
    if (seats < 1) { toast.error("Le plan doit comporter au moins un siège."); return; }
    setSaving(true);
    try {
      const payload = { name: form.name.trim(), brand: form.brand.trim() || undefined, type: form.type, seatCount: seats, layout };
      if (editId) {
        await db.transact(db.tx.vehicleModels[editId].update(payload));
        toast.success("Modèle mis à jour.");
      } else {
        await db.transact(db.tx.vehicleModels[id()].update({ ...payload, createdAt: Date.now() }).link({ cooperative: coopId }));
        toast.success("Modèle créé.");
      }
      setOpen(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Échec.");
    } finally {
      setSaving(false);
    }
  }

  async function del(m: any) {
    if (await confirm({ title: "Supprimer le modèle ?", message: m.name, confirmLabel: "Supprimer", tone: "danger" })) {
      await db.transact(db.tx.vehicleModels[m.id].update({ deletedAt: Date.now() }));
      toast.success("Modèle supprimé.");
    }
  }

  const atLimit = !isPlatformAdmin && models.length >= FREE_TRIAL_MAX;

  const columns: Column<any>[] = [
    {
      key: "name",
      header: "Modèle",
      render: (m) => (
        <span className="inline-flex items-center gap-2 font-semibold text-ink">
          <CarFront size={15} className="text-ink-soft/60" /> {m.name}
          {m.brand && <span className="text-xs font-normal text-ink-soft">· {m.brand}</span>}
        </span>
      ),
    },
    { key: "type", header: "Type", render: (m) => <span className="capitalize text-ink-soft">{m.type ?? "—"}</span> },
    { key: "seats", header: "Places", render: (m) => <Badge tone="neutral">{m.seatCount} places</Badge> },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (m) => (
        <div className="flex justify-end gap-1">
          <Button size="sm" variant="ghost" onClick={() => openEdit(m)}>Modifier</Button>
          <Button size="sm" variant="ghost" className="text-danger hover:bg-danger/10" onClick={() => del(m)}>Supprimer</Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardShell
      nav={coopNav(slug, "models", { role, permissions, isPlatformAdmin })}
      title="Modèles de véhicule"
      subtitle="Déclarez vos modèles (places connues) — le véhicule physique s'assigne plus tard."
      tenant={coop.displayName}
      logoUrl={coop.logoUrl}
      breadcrumb={<><span>{coop.displayName}</span><ChevronRight size={12} /><span className="text-ink">Modèles</span></>}
      action={
        <Button size="sm" onClick={openCreate} disabled={atLimit}>
          <Plus size={16} /> Nouveau modèle
        </Button>
      }
    >
      {atLimit && (
        <div className="mb-4 rounded-md border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
          Limite de l'essai gratuit atteinte ({FREE_TRIAL_MAX} modèles). Passez à un plan supérieur pour en ajouter.
        </div>
      )}

      <DataTable columns={columns} rows={models} loading={isLoading} empty="Aucun modèle. Ajoutez-en un (ex. Hiace 15 places)." />

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title={editId ? "Modifier le modèle" : "Nouveau modèle"}
        width="max-w-2xl"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)} disabled={saving}>Annuler</Button>
            <Button size="sm" onClick={save} disabled={saving}>{saving ? "…" : "Enregistrer"}</Button>
          </div>
        }
      >
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nom du modèle"><Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Hiace 15" /></Field>
            <Field label="Marque"><Input value={form.brand} onChange={(e) => set("brand", e.target.value)} placeholder="Toyota" /></Field>
          </div>
          <Field label="Type">
            <Input value={form.type} onChange={(e) => set("type", e.target.value)} placeholder="minibus" />
          </Field>

          <div className="rounded-md border border-ink/10 p-4">
            <div className="mb-3 flex items-end gap-4">
              <Field label="Rangées"><Input inputMode="numeric" value={form.rows} onChange={(e) => set("rows", e.target.value)} className="w-20" /></Field>
              <Field label="Colonnes"><Input inputMode="numeric" value={form.cols} onChange={(e) => set("cols", e.target.value)} className="w-20" /></Field>
              <Button variant="outline" size="sm" onClick={regen}>Régénérer</Button>
              <span className="ml-auto text-sm font-semibold text-ink">{seats} sièges</span>
            </div>
            <div className="overflow-x-auto">
              <SeatEditor layout={layout} onChange={setLayout} />
            </div>
          </div>
        </div>
      </Drawer>
    </DashboardShell>
  );
}
