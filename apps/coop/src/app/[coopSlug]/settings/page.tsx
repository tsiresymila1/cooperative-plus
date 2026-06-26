"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ChevronRight, Eye, EyeOff, Trash2 } from "lucide-react";
import {
  DashboardShell,
  coopNav,
  useCoop,
  db,
  Button,
  Badge,
  FormSection,
  Field,
  ImageUpload,
  toast,
  fmtMoney,
  subStatus,
  notDeleted,
  toInt,
  toFloat,
} from "@cp/ui";
import { Input } from "@cp/ui/shadcn";

const profileSchema = z.object({
  displayName: z.string().trim().min(1, "Nom requis"),
  phone: z.string().optional(),
  email: z.union([z.literal(""), z.string().email("Email invalide")]),
  address: z.string().optional(),
  brandColor: z.string(),
  cutoffMinutes: z.string().refine((s) => /^\d+$/.test(s.trim()), "Valeur invalide"),
  refundPct: z.string().refine((s) => /^\d+(\.\d+)?$/.test(s.trim()), "Valeur invalide"),
});
type ProfileValues = z.infer<typeof profileSchema>;

export default function SettingsPage() {
  const { coopId, slug, coop, role, permissions, isPlatformAdmin } = useCoop();

  // Subscription + plan, and quota usage counts.
  const { data } = db.useQuery({
    cooperatives: {
      $: { where: { id: coopId } },
      subscriptions: { plan: {} },
      vehicles: {},
      routes: {},
      tripInstances: {},
      members: {},
      secrets: {},
    },
  });

  const co = data?.cooperatives?.[0];
  const sub = (co?.subscriptions ?? [])[0];
  const secrets = (co as any)?.secrets;
  const plan = sub?.plan;

  const vehicles = (co?.vehicles ?? []).filter(notDeleted).length;
  const routes = (co?.routes ?? []).filter(notDeleted).length;
  const assistants = (co?.members ?? []).filter((m: any) => m.role === "assistant").length;
  const trips = (co?.tripInstances ?? []).filter(notDeleted).length;

  return (
    <DashboardShell
      nav={coopNav(slug, "settings", { role, permissions, isPlatformAdmin })}
      title="Paramètres"
      subtitle="Identité, réservation, paiements et abonnement."
      tenant={coop.displayName}
      logoUrl={coop.logoUrl}
      breadcrumb={
        <>
          <span>{coop.displayName}</span>
          <ChevronRight size={12} />
          <span className="text-ink">Paramètres</span>
        </>
      }
    >
      <div className="mx-auto max-w-4xl">
        <ProfileSections coop={coop} coopId={coopId} />
        <PaymentMethodsSection coop={coop} coopId={coopId} />
        <PapiSection coopId={coopId} secrets={secrets} />
        <SubscriptionSection sub={sub} plan={plan} />
        <QuotaSection plan={plan} usage={{ vehicles, routes, assistants, trips }} />
      </div>
    </DashboardShell>
  );
}

function ProfileSections({ coop, coopId }: { coop: any; coopId: string }) {
  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    mode: "onChange",
    defaultValues: {
      displayName: "",
      phone: "",
      email: "",
      address: "",
      brandColor: "#f5821f",
      cutoffMinutes: "0",
      refundPct: "0",
    },
  });
  const brandColor = watch("brandColor");

  useEffect(() => {
    reset({
      displayName: coop.displayName ?? "",
      phone: coop.phone ?? "",
      email: coop.email ?? "",
      address: coop.address ?? "",
      brandColor: coop.brandColor ?? "#f5821f",
      cutoffMinutes: String(coop.cutoffMinutes ?? (coop.cutoffHours ?? 0) * 60),
      refundPct: String(coop.refundPct ?? 0),
    });
  }, [coop, reset]);

  const save = handleSubmit(async (v) => {
    try {
      await db.transact(
        db.tx.cooperatives[coopId].update({
          displayName: v.displayName,
          phone: v.phone || undefined,
          email: v.email || undefined,
          address: v.address || undefined,
          brandColor: v.brandColor,
          cutoffMinutes: toInt(v.cutoffMinutes),
          refundPct: toFloat(v.refundPct),
        }),
      );
      toast.success("Profil mis à jour");
    } catch (e: any) {
      toast.error("Erreur: " + (e?.message ?? "inconnue"));
    }
  });

  const onLogo = async (file: File) => {
    try {
      const res = await db.storage.uploadFile(`coops/${coopId}/logo-${Date.now()}-${file.name}`, file);
      const q = await db.queryOnce({ $files: { $: { where: { id: (res as any).data.id } } } });
      const url = q.data?.$files?.[0]?.url;
      if (url) await db.transact(db.tx.cooperatives[coopId].update({ logoUrl: url }));
      toast.success("Logo mis à jour");
    } catch (err: any) {
      toast.error("Échec de l'upload: " + (err?.message ?? "inconnu"));
    }
  };

  return (
    <>
      <FormSection index="01" title="Identité" description="Nom, logo et coordonnées affichés aux clients.">
        <div className="grid gap-4">
          <ImageUpload value={coop.logoUrl} onFile={onLogo} />
          <Field label="Nom affiché" error={errors.displayName?.message}>
            <Input {...register("displayName")} />
          </Field>
          <Field label="Couleur de la marque" hint="L'espace coopérative suivra cette couleur.">
            <div className="flex items-center gap-3">
              <input type="color" value={brandColor} onChange={(e) => setValue("brandColor", e.target.value, { shouldValidate: true })}
                className="h-10 w-14 cursor-pointer rounded-[--radius] border border-ink/12 bg-paper p-1" />
              <Input value={brandColor} onChange={(e) => setValue("brandColor", e.target.value, { shouldValidate: true })} className="w-32 font-mono" />
              <span className="inline-flex h-8 items-center rounded-full px-4 text-xs font-semibold text-white" style={{ background: brandColor }}>Aperçu</span>
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Téléphone" error={errors.phone?.message}>
              <Input {...register("phone")} />
            </Field>
            <Field label="Email" error={errors.email?.message}>
              <Input type="email" {...register("email")} />
            </Field>
          </div>
          <Field label="Adresse" error={errors.address?.message}>
            <Input {...register("address")} />
          </Field>
        </div>
      </FormSection>

      <FormSection index="02" title="Réservation" description="Délai limite avant départ et politique de remboursement.">
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Minutes limite avant départ" hint="Cutoff pour la réservation (en minutes)" error={errors.cutoffMinutes?.message}>
              <Input inputMode="numeric" {...register("cutoffMinutes")} />
            </Field>
            <Field label="% de remboursement" hint="Politique d'annulation" error={errors.refundPct?.message}>
              <Input inputMode="numeric" {...register("refundPct")} />
            </Field>
          </div>
          <div className="flex justify-end">
            <Button size="sm" onClick={save} disabled={isSubmitting}>
              {isSubmitting ? "…" : "Enregistrer"}
            </Button>
          </div>
        </div>
      </FormSection>
    </>
  );
}

const STANDARD_METHODS: { key: string; label: string }[] = [
  { key: "cash", label: "Espèces" },
  { key: "mobile_money", label: "Mobile Money" },
  { key: "card", label: "Carte" },
];

function PaymentMethodsSection({ coop, coopId }: { coop: any; coopId: string }) {
  const [methods, setMethods] = useState<string[]>(["cash", "mobile_money", "card"]);
  const [custom, setCustom] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const list = Array.isArray(coop.paymentMethods) ? (coop.paymentMethods as string[]) : null;
    setMethods(list && list.length ? list : ["cash", "mobile_money", "card"]);
  }, [coop]);

  const toggle = (key: string) => {
    setMethods((m) => (m.includes(key) ? m.filter((x) => x !== key) : [...m, key]));
  };

  const addCustom = () => {
    const v = custom.trim();
    if (!v) return;
    if (methods.includes(v)) {
      toast.error("Ce moyen existe déjà");
      return;
    }
    setMethods((m) => [...m, v]);
    setCustom("");
  };

  const label = (m: string) =>
    STANDARD_METHODS.find((s) => s.key === m)?.label ?? m.charAt(0).toUpperCase() + m.slice(1);

  const save = async () => {
    setSaving(true);
    try {
      await db.transact(db.tx.cooperatives[coopId].update({ paymentMethods: methods }));
      toast.success("Moyens de paiement mis à jour");
    } catch (e: any) {
      toast.error("Erreur: " + (e?.message ?? "inconnue"));
    } finally {
      setSaving(false);
    }
  };

  const customMethods = methods.filter((m) => !STANDARD_METHODS.some((s) => s.key === m));

  return (
    <FormSection
      index="03"
      title="Moyens de paiement"
      description="Méthodes acceptées au guichet et lors des réservations en ligne."
    >
      <div className="grid gap-4">
        <div className="grid gap-2">
          {STANDARD_METHODS.map((s) => (
            <label key={s.key} className="flex cursor-pointer items-center gap-3 text-sm text-ink">
              <input
                type="checkbox"
                checked={methods.includes(s.key)}
                onChange={() => toggle(s.key)}
                className="h-4 w-4 accent-laterite"
              />
              {s.label}
            </label>
          ))}
          {customMethods.map((m) => (
            <div key={m} className="flex items-center gap-3 text-sm text-ink">
              <span className="flex-1">{label(m)}</span>
              <Badge tone="neutral">Personnalisé</Badge>
              <button
                type="button"
                onClick={() => setMethods((prev) => prev.filter((x) => x !== m))}
                className="grid h-7 w-7 place-items-center rounded-[--radius] text-ink-soft/60 transition-colors hover:bg-danger/10 hover:text-danger"
                title="Supprimer"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>

        <Field label="Ajouter un moyen personnalisé">
          <div className="flex gap-2">
            <Input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustom();
                }
              }}
              placeholder="ex: Chèque"
            />
            <Button size="sm" variant="outline" onClick={addCustom} type="button">
              Ajouter
            </Button>
          </div>
        </Field>

        <div className="flex justify-end">
          <Button size="sm" onClick={save} disabled={saving}>
            {saving ? "…" : "Enregistrer"}
          </Button>
        </div>
      </div>
    </FormSection>
  );
}

function PapiSection({ coopId, secrets }: { coopId: string; secrets: any }) {
  const [key, setKey] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);

  // Don't prefill with the encrypted value — show placeholder indicating key exists
  useEffect(() => {
    setKey("");
  }, [secrets?.id]);

  const save = async () => {
    if (!key.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/secrets/papi-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coopId, papiApiKey: key, existingSecretId: secrets?.id }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Erreur serveur");
      }
      toast.success("Clé PAPI enregistrée (chiffrée)");
    } catch (e: any) {
      toast.error("Erreur: " + (e?.message ?? "inconnue"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormSection
      index="04"
      title="Paiement en ligne (PAPI)"
      description="Clé API PAPI pour activer le paiement en ligne. Obtenez-la depuis votre tableau de bord PAPI → Développeur."
    >
      <div className="grid gap-4">
        <Field label="Clé API PAPI" hint="Gardez cette clé secrète. Visible uniquement par les membres de la coopérative.">
          <div className="relative flex items-center">
            <Input
              type={show ? "text" : "password"}
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Coller votre clé API ici…"
              className="pr-10 font-mono text-sm"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-3 text-ink-soft/60 hover:text-ink"
            >
              {show ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </Field>
        {secrets?.papiApiKey && (
          <p className="text-xs text-baobab">✓ Paiement en ligne actif — les clients voient le bouton "Payer en ligne".</p>
        )}
        <div className="flex justify-end">
          <Button size="sm" onClick={save} disabled={saving}>
            {saving ? "…" : "Enregistrer"}
          </Button>
        </div>
      </div>
    </FormSection>
  );
}

function SubscriptionSection({ sub, plan }: { sub: any; plan: any }) {
  const s = sub ? subStatus[sub.status] ?? { label: sub.status, tone: "neutral" as const } : null;
  return (
    <FormSection index="05" title="Abonnement" description="Votre formule et son statut de facturation.">
      {plan ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-display text-2xl font-bold text-laterite">{plan.name}</span>
            {s && <Badge tone={s.tone}>{s.label}</Badge>}
          </div>
          <p className="text-sm text-ink-soft">
            {fmtMoney(plan.priceAmount)} / {plan.interval === "month" ? "mois" : plan.interval}
          </p>
          {sub?.currentPeriodEnd && (
            <p className="text-xs text-ink-soft/60">
              Période en cours jusqu&apos;au {new Date(sub.currentPeriodEnd).toLocaleDateString("fr")}
            </p>
          )}
        </div>
      ) : (
        <p className="text-sm text-ink-soft">Aucun abonnement actif.</p>
      )}
    </FormSection>
  );
}

function QuotaSection({
  plan,
  usage,
}: {
  plan: any;
  usage: { vehicles: number; routes: number; assistants: number; trips: number };
}) {
  if (!plan) return null;
  const bars = [
    { label: "Véhicules", used: usage.vehicles, max: plan.maxVehicles },
    { label: "Itinéraires", used: usage.routes, max: plan.maxRoutes },
    { label: "Assistants", used: usage.assistants, max: plan.maxAssistants },
    { label: "Trajets / mois", used: usage.trips, max: plan.maxTripsMonth },
  ];
  return (
    <FormSection index="06" title="Quotas" description="Utilisation par rapport aux limites de votre formule.">
      <div className="space-y-4">
        {bars.map((b) => {
          const pct = b.max > 0 ? Math.min(100, Math.round((b.used / b.max) * 100)) : 0;
          const over = b.used >= b.max;
          return (
            <div key={b.label}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-ink-soft">{b.label}</span>
                <span className="tabular-nums font-medium text-ink">
                  {b.used} / {b.max}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-ink/8">
                <div
                  className={over ? "h-full bg-laterite" : "h-full bg-baobab"}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </FormSection>
  );
}
