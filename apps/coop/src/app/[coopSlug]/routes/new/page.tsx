"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, ChevronRight, MapPin } from "lucide-react";
import {
  DashboardShell,
  coopNav,
  useCoop,
  db,
  id,
  Button,
  FormSection,
  Field,
  toast,
  routeStatus,
  notDeleted,
  useCoopPlan,
  toMoney,
  toInt,
} from "@cp/ui";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Input,
} from "@cp/ui/shadcn";

const STATUSES = ["active", "inactive"];

const schema = z.object({
  name: z.string().optional(),
  originId: z.string().min(1, "Sélectionnez une origine"),
  destId: z.string().min(1, "Sélectionnez une destination"),
  price: z.string().optional(),
  dist: z.string().optional(),
  dur: z.string().optional(),
  status: z.string(),
});
type Values = z.infer<typeof schema>;

export default function NewRoutePage() {
  const { coopId, slug, coop, role, permissions, isPlatformAdmin } = useCoop();
  const router = useRouter();
  const currency = coop.currency ?? "MGA";
  const { overLimit, max } = useCoopPlan(coopId);

  const { data } = db.useQuery({
    destinations: { $: { where: { "cooperative.id": coopId } } },
    cooperatives: { $: { where: { id: coopId } }, enabledDestinations: {} },
  });
  const destinations = useMemo(() => {
    const priv = (data?.destinations ?? []).filter(notDeleted);
    const enabled = (data?.cooperatives?.[0]?.enabledDestinations ?? []).filter(notDeleted);
    const map = new Map<string, any>();
    for (const d of [...enabled, ...priv]) map.set(d.id, d);
    return Array.from(map.values()).sort((a: any, b: any) =>
      String(a.name).localeCompare(String(b.name)),
    );
  }, [data]);

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: { name: "", originId: "", destId: "", price: "", dist: "", dur: "", status: "active" },
  });
  const [nameEdited, setNameEdited] = useState(false);
  const name = watch("name");
  const originId = watch("originId");
  const destId = watch("destId");
  const status = watch("status");

  // Auto-fill name "Origine → Destination" until the user types their own.
  useEffect(() => {
    if (nameEdited) return;
    const o = destinations.find((d: any) => d.id === originId)?.name;
    const d = destinations.find((x: any) => x.id === destId)?.name;
    setValue("name", o && d ? `${o} → ${d}` : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originId, destId, nameEdited, destinations]);

  const submit = handleSubmit(async (v) => {
    const origin = destinations.find((d: any) => d.id === v.originId);
    const dest = destinations.find((d: any) => d.id === v.destId);
    const finalName = v.name || `${origin?.name ?? ""} → ${dest?.name ?? ""}`;
    if (overLimit("routes")) { toast.error(`Limite du plan atteinte (${max.routes} itinéraires). Changez de plan dans Abonnement.`); return; }

    try {
      const payload: any = { name: finalName, basePrice: toMoney(v.price ?? ""), currency, status: v.status };
      if (v.dist) payload.distanceKm = toInt(v.dist);
      if (v.dur) payload.durationMin = toInt(v.dur);

      await db.transact(
        db.tx.routes[id()]
          .update({ ...payload, createdAt: Date.now() })
          .link({ cooperative: coopId, origin: v.originId, destination: v.destId }),
      );
      toast.success("Itinéraire créé");
      router.push(`/${slug}/routes`);
    } catch (e: any) {
      toast.error("Erreur: " + (e?.message ?? "inconnue"));
    }
  });

  return (
    <DashboardShell
      nav={coopNav(slug, "routes", { role, permissions, isPlatformAdmin })}
      title="Nouvel itinéraire"
      tenant={coop.displayName}
      logoUrl={coop.logoUrl}
      breadcrumb={
        <>
          <span>{coop.displayName}</span>
          <ChevronRight size={12} />
          <span>Itinéraires</span>
          <ChevronRight size={12} />
          <span className="text-ink">Nouveau</span>
        </>
      }
      action={
        <Link href={`/${slug}/routes`}>
          <Button size="sm" variant="outline">
            <ArrowLeft size={16} /> Retour
          </Button>
        </Link>
      }
    >
      <div className="mx-auto max-w-4xl">
        <FormSection index="01" title="Trajet" description="Origine, destination et nom affiché de l'itinéraire.">
        <div className="grid gap-4">
          <Field label="Nom" hint="Auto-rempli depuis Origine → Destination">
            <Input value={name ?? ""} onChange={(e) => { setValue("name", e.target.value); setNameEdited(true); }} placeholder="Origine → Destination" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Origine" error={errors.originId?.message}>
              <Select value={originId} onValueChange={(v) => setValue("originId", v, { shouldValidate: true })}>
                <SelectTrigger>
                  <span className="inline-flex items-center gap-2">
                    <MapPin size={15} className="text-ink-soft/60" />
                    <SelectValue placeholder="Sélectionner…" />
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {destinations.map((d: any) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Destination" error={errors.destId?.message}>
              <Select value={destId} onValueChange={(v) => setValue("destId", v, { shouldValidate: true })}>
                <SelectTrigger>
                  <span className="inline-flex items-center gap-2">
                    <MapPin size={15} className="text-ink-soft/60" />
                    <SelectValue placeholder="Sélectionner…" />
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {destinations.map((d: any) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
        </div>
        </FormSection>

        <FormSection index="02" title="Tarif & détails" description="Prix de base, distance, durée et statut de l'itinéraire.">
        <div className="grid gap-4">
          <div className="grid grid-cols-3 gap-4">
            <Field label="Prix (MGA)">
              <Input inputMode="numeric" {...register("price")} />
            </Field>
            <Field label="Distance (km)">
              <Input inputMode="numeric" {...register("dist")} />
            </Field>
            <Field label="Durée (min)">
              <Input inputMode="numeric" {...register("dur")} />
            </Field>
          </div>
          <Field label="Statut">
            <Select value={status} onValueChange={(v) => setValue("status", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {routeStatus[s]?.label ?? s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        </FormSection>

        <div className="flex justify-end gap-2 pt-2">
          <Link href={`/${slug}/routes`}>
            <Button variant="outline" size="sm">
              Annuler
            </Button>
          </Link>
          <Button size="sm" onClick={submit} disabled={isSubmitting}>
            {isSubmitting ? "…" : "Créer"}
          </Button>
        </div>
      </div>
    </DashboardShell>
  );
}
