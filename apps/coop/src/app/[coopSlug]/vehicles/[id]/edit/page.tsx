"use client";
import { PageSkeleton } from "@cp/ui";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight, Bus } from "lucide-react";
import {
  DashboardShell,
  coopNav,
  useCoop,
  db,
  Button,
  FormSection,
  Field,
  Textarea,
  Badge,
  toast,
  vehicleStatus,
  notDeleted,
} from "@cp/ui";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Input,
} from "@cp/ui/shadcn";

const STATUSES = ["active", "maintenance", "inactive"];
const seatsOf = (m: any) =>
  Array.isArray(m?.layout) ? m.layout.filter((c: any) => c.type === "seat").length : (m?.seatCount ?? 0);

export default function EditVehiclePage() {
  const { coopId, slug, coop, role, permissions, isPlatformAdmin } = useCoop();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const vehicleId = params.id;

  const { data, isLoading } = db.useQuery({
    vehicles: { $: { where: { id: vehicleId, "cooperative.id": coopId } }, model: {} },
    vehicleModels: { $: { where: { "cooperative.id": coopId } } },
  });
  const vehicle = data?.vehicles?.[0];
  const models = (data?.vehicleModels ?? []).filter(notDeleted);

  const [hydrated, setHydrated] = useState(false);
  const [name, setName] = useState("");
  const [reg, setReg] = useState("");
  const [modelId, setModelId] = useState("");
  const [status, setStatus] = useState("active");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const model = models.find((m: any) => m.id === modelId);

  useEffect(() => {
    if (vehicle && !hydrated) {
      setName(vehicle.name ?? "");
      setReg(vehicle.registrationNo ?? "");
      setModelId((vehicle.model as any)?.id ?? "");
      setStatus(vehicle.status ?? "active");
      setNotes(vehicle.notes ?? "");
      setHydrated(true);
    }
  }, [vehicle, hydrated]);

  const submit = async () => {
    if (!name || !reg) { toast.error("Nom et immatriculation requis"); return; }
    if (!model) { toast.error("Sélectionnez un modèle"); return; }
    setSaving(true);
    try {
      const prev = (vehicle?.model as any)?.id;
      let chunk = db.tx.vehicles[vehicleId].update({
        name,
        registrationNo: reg,
        type: model.type ?? vehicle?.type ?? "minibus_18",
        seatCount: seatsOf(model),
        status,
        notes,
      }).link({ model: model.id });
      if (prev && prev !== model.id) chunk = chunk.unlink({ model: prev });
      await db.transact(chunk);
      toast.success("Véhicule mis à jour");
      router.push(`/${slug}/vehicles`);
    } catch (e: any) {
      toast.error("Erreur: " + (e?.message ?? "inconnue"));
      setSaving(false);
    }
  };

  return (
    <DashboardShell
      nav={coopNav(slug, "vehicles", { role, permissions, isPlatformAdmin })}
      title="Modifier le véhicule"
      tenant={coop.displayName}
      logoUrl={coop.logoUrl}
      breadcrumb={
        <>
          <span>{coop.displayName}</span>
          <ChevronRight size={12} />
          <span>Véhicules</span>
          <ChevronRight size={12} />
          <span className="text-ink">Modifier</span>
        </>
      }
      action={
        <Link href={`/${slug}/vehicles`}>
          <Button size="sm" variant="outline">
            <ArrowLeft size={16} /> Retour
          </Button>
        </Link>
      }
    >
      {isLoading ? (
        <PageSkeleton />
      ) : !vehicle ? (
        <p className="text-ink-soft">Véhicule introuvable.</p>
      ) : (
        <div className="mx-auto max-w-4xl">
          <FormSection index="01" title="Identité" description="Nom, immatriculation et modèle. Le plan de sièges vient du modèle.">
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Nom">
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </Field>
                <Field label="Immatriculation">
                  <Input value={reg} onChange={(e) => setReg(e.target.value)} />
                </Field>
              </div>
              <Field label="Modèle" hint={model ? `${seatsOf(model)} places` : "Le modèle détermine le nombre de places et le plan de sièges."}>
                <Select value={modelId} onValueChange={setModelId}>
                  <SelectTrigger>
                    <span className="inline-flex items-center gap-2"><Bus size={15} className="text-ink-soft/60" /><SelectValue placeholder="Choisir un modèle…" /></span>
                  </SelectTrigger>
                  <SelectContent>
                    {models.map((m: any) => <SelectItem key={m.id} value={m.id}>{m.name} · {seatsOf(m)} places</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Statut">
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => <SelectItem key={s} value={s}>{vehicleStatus[s]?.label ?? s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Notes">
                <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </Field>
              {model && <div><Badge tone="neutral">{seatsOf(model)} places · {model.name}</Badge></div>}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Link href={`/${slug}/vehicles`}>
                <Button variant="outline" size="sm">Annuler</Button>
              </Link>
              <Button size="sm" onClick={submit} disabled={saving}>{saving ? "…" : "Enregistrer"}</Button>
            </div>
          </FormSection>
        </div>
      )}
    </DashboardShell>
  );
}
