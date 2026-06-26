"use client";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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

const schema = z.object({
  name: z.string().trim().min(1, "Le nom est requis"),
  licenseNo: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  avatarUrl: z.string().optional(),
});
type Values = z.infer<typeof schema>;
const EMPTY: Values = { name: "", licenseNo: "", phone: "", address: "", avatarUrl: "" };

export default function DriversPage() {
  const { coopId, slug, coop, role, permissions, isPlatformAdmin } = useCoop();
  const confirm = useConfirm();

  const { data, isLoading } = db.useQuery({ drivers: { $: { where: { "cooperative.id": coopId } } } });
  const drivers = useMemo(() => (data?.drivers ?? []).filter(notDeleted), [data]);

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: EMPTY,
  });
  const avatarUrl = watch("avatarUrl");

  function openCreate() { setEditId(null); reset(EMPTY); setOpen(true); }
  function openEdit(d: any) {
    setEditId(d.id);
    reset({ name: d.name ?? "", licenseNo: d.licenseNo ?? "", phone: d.phone ?? "", address: d.address ?? "", avatarUrl: d.avatarUrl ?? "" });
    setOpen(true);
  }

  async function onAvatar(file: File) {
    try {
      const res = await db.storage.uploadFile(`coops/${coopId}/drivers/${Date.now()}-${file.name}`, file);
      const q = await db.queryOnce({ $files: { $: { where: { id: (res as any).data.id } } } });
      const url = q.data?.$files?.[0]?.url;
      if (url) setValue("avatarUrl", url);
    } catch (e: any) {
      toast.error(e?.message ?? "Échec de l'upload.");
    }
  }

  const save = handleSubmit(async (v) => {
    try {
      const payload = {
        name: v.name.trim(),
        licenseNo: v.licenseNo?.trim() || undefined,
        phone: v.phone?.trim() || undefined,
        address: v.address?.trim() || undefined,
        avatarUrl: v.avatarUrl || undefined,
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
      toast.error("Erreur: " + (e?.message ?? "inconnue"));
    }
  });

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
            <Button variant="outline" size="sm" onClick={() => setOpen(false)} disabled={isSubmitting}>Annuler</Button>
            <Button size="sm" onClick={save} disabled={isSubmitting}>{isSubmitting ? "…" : "Enregistrer"}</Button>
          </div>
        }
      >
        <div className="grid gap-4">
          <Field label="Photo">
            <ImageUpload value={avatarUrl} onFile={onAvatar} hint="Avatar du chauffeur (optionnel)." />
          </Field>
          <Field label="Nom complet" error={errors.name?.message}><Input {...register("name")} placeholder="Rakoto Jean" /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="N° de permis"><Input {...register("licenseNo")} placeholder="123456 A" /></Field>
            <Field label="Téléphone"><Input {...register("phone")} placeholder="034 00 000 00" /></Field>
          </div>
          <Field label="Adresse"><Input {...register("address")} placeholder="Lot II… Antananarivo" /></Field>
        </div>
      </Drawer>
    </DashboardShell>
  );
}
