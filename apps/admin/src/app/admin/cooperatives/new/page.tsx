"use client";
import { AdminShell } from "@/components/admin-shell";
import { useCreateCooperative } from "@/lib/queries/cooperatives";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";
import {
  adminNav,
  db,
  Button,
  FormSection,
  Field,
  toast,
} from "@cp/ui";
import {
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@cp/ui/shadcn";

export default function NewCooperativePage() {
  const router = useRouter();
  const { data } = db.useQuery({ plans: {} });
  const plans = (data?.plans ?? []).filter((p: any) => p.isActive);

  const [form, setForm] = useState({
    slug: "",
    displayName: "",
    legalName: "",
    region: "",
    planId: "",
    ownerEmail: "",
    ownerName: "",
    ownerPassword: "",
  });
  const createCoop = useCreateCooperative();
  const saving = createCoop.isPending;
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    if (!form.slug.trim() || !form.displayName.trim() || !form.legalName.trim()) {
      toast.error("Slug, nom commercial et raison sociale sont requis.");
      return;
    }
    if (form.ownerEmail.trim() && form.ownerPassword.length < 6) {
      toast.error("Le mot de passe du propriétaire doit faire au moins 6 caractères.");
      return;
    }
    createCoop.mutate(form, {
      onSuccess: () => { toast.success("Coopérative créée."); router.push("/admin/cooperatives"); },
      onError: (e) => toast.error(e instanceof Error ? e.message : "Échec de la création."),
    });
  };

  return (
    <AdminShell
      nav={adminNav("cooperatives")}
      title="Nouvelle coopérative"
      tenant="Plateforme"
      breadcrumb={
        <>
          <span>Plateforme</span>
          <ChevronRight size={12} />
          <Link href="/admin/cooperatives">Coopératives</Link>
          <ChevronRight size={12} />
          <span className="text-ink">Nouvelle</span>
        </>
      }
      action={
        <Link href="/admin/cooperatives">
          <Button size="sm" variant="outline">
            <ArrowLeft size={16} /> Retour
          </Button>
        </Link>
      }
    >
      <div className="mx-auto max-w-4xl">
        <FormSection index="01" title="Identité" description="Informations de la coopérative.">
          <div className="grid gap-4">
            <Field label="Slug">
              <Input value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="cotisse" />
            </Field>
            <Field label="Nom commercial">
              <Input value={form.displayName} onChange={(e) => set("displayName", e.target.value)} placeholder="Cotisse Transport" />
            </Field>
            <Field label="Raison sociale">
              <Input value={form.legalName} onChange={(e) => set("legalName", e.target.value)} />
            </Field>
            <Field label="Région">
              <Input value={form.region} onChange={(e) => set("region", e.target.value)} placeholder="Analamanga" />
            </Field>
            <Field label="Plan d'abonnement">
              <Select value={form.planId || "none"} onValueChange={(v) => set("planId", v === "none" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="— Aucun —" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Aucun —</SelectItem>
                  {plans.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
        </FormSection>

        <FormSection
          index="02"
          title="Compte propriétaire"
          description="Crée un compte avec mot de passe. Le propriétaire se connecte à l'app coopérative avec cet email + mot de passe."
        >
          <div className="grid gap-4">
            <Field label="Email du propriétaire" hint="Laisser vide pour ne pas créer de compte.">
              <Input
                type="email"
                value={form.ownerEmail}
                onChange={(e) => set("ownerEmail", e.target.value)}
                placeholder="proprietaire@exemple.mg"
              />
            </Field>
            <Field label="Nom du propriétaire">
              <Input value={form.ownerName} onChange={(e) => set("ownerName", e.target.value)} placeholder="Rakoto Jean" />
            </Field>
            <Field label="Mot de passe" hint="Au moins 6 caractères.">
              <Input
                type="password"
                value={form.ownerPassword}
                onChange={(e) => set("ownerPassword", e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </Field>
          </div>
        </FormSection>

        <div className="flex justify-end gap-2 pt-2">
          <Link href="/admin/cooperatives">
            <Button variant="outline" size="sm">
              Annuler
            </Button>
          </Link>
          <Button size="sm" onClick={submit} disabled={saving}>
            {saving ? "…" : "Créer"}
          </Button>
        </div>
      </div>
    </AdminShell>
  );
}
