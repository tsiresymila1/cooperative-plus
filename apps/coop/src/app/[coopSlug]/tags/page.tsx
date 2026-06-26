"use client";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Tag as TagIcon, ChevronRight } from "lucide-react";
import {
  DashboardShell,
  coopNav,
  useCoop,
  db,
  id,
  Button,
  Badge,
  Card,
  Drawer,
  Field,
  TagBadge,
  DataTable,
  useConfirm,
  toast,
  notDeleted,
  type Column,
} from "@cp/ui";
import { Input } from "@cp/ui/shadcn";

const schema = z.object({
  name: z.string().trim().min(1, "Le nom est requis"),
  color: z.string(),
});
type Values = z.infer<typeof schema>;
const EMPTY: Values = { name: "", color: "#0f2d5c" };

export default function CoopTagsPage() {
  const { coopId, slug, coop, role, permissions, isPlatformAdmin } = useCoop();
  const confirm = useConfirm();

  const { data, isLoading } = db.useQuery({ tags: { $: {}, cooperative: {} } });
  const all = (data?.tags ?? []).filter(notDeleted);

  const mine = useMemo(
    () => all.filter((t: any) => !t.isGlobal && t.cooperative?.id === coopId),
    [all, coopId],
  );
  const globals = useMemo(
    () => all.filter((t: any) => t.isGlobal).sort((a: any, b: any) => String(a.name).localeCompare(String(b.name))),
    [all],
  );

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: EMPTY,
  });
  const color = watch("color");
  const name = watch("name");

  function openCreate() { setEditId(null); reset(EMPTY); setOpen(true); }
  function openEdit(t: any) { setEditId(t.id); reset({ name: t.name, color: t.color || "#0f2d5c" }); setOpen(true); }

  const save = handleSubmit(async (v) => {
    try {
      if (editId) {
        await db.transact(db.tx.tags[editId].update({ name: v.name.trim(), color: v.color }));
        toast.success("Tag mis à jour.");
      } else {
        await db.transact(
          db.tx.tags[id()]
            .update({ name: v.name.trim(), color: v.color, isGlobal: false, createdAt: Date.now() })
            .link({ cooperative: coopId }),
        );
        toast.success("Tag créé.");
      }
      setOpen(false);
    } catch (e: any) {
      toast.error("Erreur: " + (e?.message ?? "inconnue"));
    }
  });

  async function del(t: any) {
    if (await confirm({ title: "Supprimer le tag ?", message: `${t.name} sera retiré des trajets taggés.`, confirmLabel: "Supprimer", tone: "danger" })) {
      await db.transact(db.tx.tags[t.id].update({ deletedAt: Date.now() }));
      toast.success("Tag supprimé.");
    }
  }

  const columns: Column<any>[] = [
    { key: "badge", header: "Aperçu", render: (t) => <TagBadge name={t.name} color={t.color} /> },
    { key: "name", header: "Nom", render: (t) => <span className="font-medium text-ink">{t.name}</span> },
    { key: "color", header: "Couleur", render: (t) => <span className="font-mono text-xs text-ink-soft">{t.color}</span> },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (t) => (
        <div className="flex justify-end gap-1">
          <Button size="sm" variant="ghost" onClick={() => openEdit(t)}>Modifier</Button>
          <Button size="sm" variant="ghost" className="text-danger hover:bg-danger/10" onClick={() => del(t)}>Supprimer</Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardShell
      nav={coopNav(slug, "tags", { role, permissions, isPlatformAdmin })}
      title="Tags trajets"
      tenant={coop.displayName}
      logoUrl={coop.logoUrl}
      breadcrumb={<><span>{coop.displayName}</span><ChevronRight size={12} /><span className="text-ink">Tags trajets</span></>}
      action={<Button size="sm" onClick={openCreate}><Plus size={16} /> Nouveau tag</Button>}
    >
      <div className="grid gap-8">
        <section>
          <div className="mb-3 flex items-center gap-2">
            <h2 className="font-display text-lg font-bold text-ink">Mes tags</h2>
            <Badge tone="success">Privés</Badge>
          </div>
          <DataTable
            columns={columns}
            rows={mine}
            loading={isLoading}
            empty={<span className="inline-flex flex-col items-center gap-2 text-ink-soft/60"><TagIcon size={28} className="text-ink-soft/30" /> Aucun tag privé.</span>}
          />
        </section>

        <section>
          <div className="mb-3 flex items-center gap-2">
            <h2 className="font-display text-lg font-bold text-ink">Tags globaux</h2>
            <Badge tone="neutral">Plateforme</Badge>
          </div>
          <p className="mb-4 text-sm text-ink-soft">Disponibles sur vos trajets, gérés par la plateforme.</p>
          <div className="flex flex-wrap gap-2">
            {globals.map((t: any) => <TagBadge key={t.id} name={t.name} color={t.color} />)}
            {!isLoading && globals.length === 0 && <p className="text-sm text-ink-soft/60">Aucun tag global.</p>}
          </div>
        </section>
      </div>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title={editId ? "Modifier le tag" : "Nouveau tag"}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)} disabled={isSubmitting}>Annuler</Button>
            <Button size="sm" onClick={save} disabled={isSubmitting}>{isSubmitting ? "…" : "Enregistrer"}</Button>
          </div>
        }
      >
        <div className="grid gap-4">
          <Field label="Nom" error={errors.name?.message}>
            <Input {...register("name")} placeholder="Premium" />
          </Field>
          <Field label="Couleur">
            <div className="flex items-center gap-3">
              <input type="color" value={color} onChange={(e) => setValue("color", e.target.value, { shouldValidate: true })}
                className="h-9 w-12 cursor-pointer rounded border border-ink/15 bg-transparent p-0.5" />
              <Input value={color} onChange={(e) => setValue("color", e.target.value, { shouldValidate: true })} className="h-9 w-32 font-mono" />
              <TagBadge name={name || "Aperçu"} color={color} />
            </div>
          </Field>
        </div>
      </Drawer>
    </DashboardShell>
  );
}
