"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, ChevronRight, Bus } from "lucide-react";
import {
  DashboardShell,
  coopNav,
  useCoop,
  db,
  id,
  Button,
  FormSection,
  Field,
  Textarea,
  Badge,
  toast,
  vehicleStatus,
  notDeleted,
  useCoopPlan,
  logActivity,
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

const schema = z.object({
  name: z.string().trim().min(1, "Nom requis"),
  reg: z.string().trim().min(1, "Immatriculation requise"),
  modelId: z.string().min(1, "Sélectionnez un modèle"),
  status: z.string(),
  notes: z.string().optional(),
});
type Values = z.infer<typeof schema>;

export default function NewVehiclePage() {
  const { coopId, slug, coop, role, permissions, isPlatformAdmin, userId } = useCoop();
  const router = useRouter();

  const { data } = db.useQuery({ vehicleModels: { $: { where: { "cooperative.id": coopId } } } });
  const models = (data?.vehicleModels ?? []).filter(notDeleted);
  const { overLimit, max } = useCoopPlan(coopId);

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: { name: "", reg: "", modelId: "", status: "active", notes: "" },
  });
  const modelId = watch("modelId");
  const status = watch("status");
  const model = models.find((m: any) => m.id === modelId);

  const submit = handleSubmit(async (v) => {
    const m = models.find((x: any) => x.id === v.modelId);
    if (!m) return;
    if (overLimit("vehicles")) { toast.error(`Limite du plan atteinte (${max.vehicles} véhicules). Changez de plan dans Abonnement.`); return; }
    try {
      const vehicleId = id();
      await db.transact(
        db.tx.vehicles[vehicleId]
          .update({
            name: v.name.trim(),
            registrationNo: v.reg.trim(),
            type: m.type ?? "minibus_18",
            seatCount: seatsOf(m),
            status: v.status,
            notes: v.notes ?? "",
            createdAt: Date.now(),
          })
          .link({ cooperative: coopId, model: m.id }),
      );
      logActivity({ coopId, actorId: userId, action: "create", entityType: "vehicle", entityId: vehicleId, label: v.name.trim() || v.reg.trim() });
      toast.success("Véhicule créé");
      router.push(`/${slug}/vehicles`);
    } catch (e: any) {
      toast.error("Erreur: " + (e?.message ?? "inconnue"));
    }
  });

  return (
    <DashboardShell
      nav={coopNav(slug, "vehicles", { role, permissions, isPlatformAdmin })}
      title="Nouveau véhicule"
      tenant={coop.displayName}
      logoUrl={coop.logoUrl}
      breadcrumb={
        <>
          <span>{coop.displayName}</span>
          <ChevronRight size={12} />
          <span>Véhicules</span>
          <ChevronRight size={12} />
          <span className="text-ink">Nouveau</span>
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
      <div className="mx-auto max-w-4xl">
        <FormSection index="01" title="Identité" description="Nom, immatriculation et modèle. Le plan de sièges vient du modèle.">
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Nom" error={errors.name?.message}>
                <Input {...register("name")} placeholder="Ex: Sprinter bleu" />
              </Field>
              <Field label="Immatriculation" error={errors.reg?.message}>
                <Input {...register("reg")} placeholder="1234 TAA" />
              </Field>
            </div>
            <Field label="Modèle" error={errors.modelId?.message} hint={model ? `${seatsOf(model)} places` : "Le modèle détermine le nombre de places et le plan de sièges."}>
              <Select value={modelId} onValueChange={(v) => setValue("modelId", v, { shouldValidate: true })}>
                <SelectTrigger>
                  <span className="inline-flex items-center gap-2"><Bus size={15} className="text-ink-soft/60" /><SelectValue placeholder="Choisir un modèle…" /></span>
                </SelectTrigger>
                <SelectContent>
                  {models.map((m: any) => <SelectItem key={m.id} value={m.id}>{m.name} · {seatsOf(m)} places</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            {models.length === 0 && (
              <p className="text-xs text-warning">Aucun modèle. Créez-en d&apos;abord dans <Link href={`/${slug}/models`} className="underline">Modèles</Link>.</p>
            )}
            <Field label="Statut">
              <Select value={status} onValueChange={(v) => setValue("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{vehicleStatus[s]?.label ?? s}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            {model && <div><Badge tone="neutral">{seatsOf(model)} places · {model.name}</Badge></div>}
          </div>
        </FormSection>

        <FormSection index="02" title="Notes" description="Informations internes.">
          <Field label="Notes">
            <Textarea rows={2} {...register("notes")} />
          </Field>
        </FormSection>

        <div className="flex justify-end gap-2 pt-2">
          <Link href={`/${slug}/vehicles`}>
            <Button variant="outline" size="sm">Annuler</Button>
          </Link>
          <Button size="sm" onClick={submit} disabled={isSubmitting}>{isSubmitting ? "…" : "Créer"}</Button>
        </div>
      </div>
    </DashboardShell>
  );
}
