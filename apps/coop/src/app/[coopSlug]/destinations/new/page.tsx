"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";
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
} from "@cp/ui";
import { Input } from "@cp/ui/shadcn";

export default function NewDestinationPage() {
  const { coopId, slug, coop, role, permissions, isPlatformAdmin } = useCoop();
  const router = useRouter();

  const [name, setName] = useState("");
  const [destSlug, setDestSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [region, setRegion] = useState("");
  const [country, setCountry] = useState("Madagascar");
  const [saving, setSaving] = useState(false);

  const slugify = (s: string) => s.toLowerCase().trim().replace(/\s+/g, "-");

  const onName = (v: string) => {
    setName(v);
    if (!slugTouched) setDestSlug(slugify(v));
  };

  const submit = async () => {
    if (!name) {
      toast.error("Nom requis");
      return;
    }
    setSaving(true);
    try {
      const payload: any = { name, country, slug: destSlug || slugify(name) };
      if (region) payload.region = region;
      await db.transact(
        db.tx.destinations[id()]
          .update({ ...payload, isPopular: false, isGlobal: false, createdAt: Date.now() })
          .link({ cooperative: coopId }),
      );
      toast.success("Destination créée");
      router.push(`/${slug}/destinations`);
    } catch (e: any) {
      toast.error("Erreur: " + (e?.message ?? "inconnue"));
      setSaving(false);
    }
  };

  return (
    <DashboardShell
      nav={coopNav(slug, "destinations", { role, permissions, isPlatformAdmin })}
      title="Nouvelle destination"
      tenant={coop.displayName}
      logoUrl={coop.logoUrl}
      breadcrumb={
        <>
          <span>{coop.displayName}</span>
          <ChevronRight size={12} />
          <span>Destinations</span>
          <ChevronRight size={12} />
          <span className="text-ink">Nouvelle</span>
        </>
      }
      action={
        <Link href={`/${slug}/destinations`}>
          <Button size="sm" variant="outline">
            <ArrowLeft size={16} /> Retour
          </Button>
        </Link>
      }
    >
      <div className="mx-auto max-w-4xl">
        <FormSection index="01" title="Localisation" description="Les destinations privées ne sont visibles que par votre coopérative.">
        <div className="grid gap-4">
          <Field label="Nom">
            <Input value={name} onChange={(e) => onName(e.target.value)} />
          </Field>
          <Field label="Slug" hint="Identifiant pour les URLs (généré depuis le nom)">
            <Input
              value={destSlug}
              onChange={(e) => {
                setSlugTouched(true);
                setDestSlug(e.target.value);
              }}
              className="font-mono"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Région">
              <Input value={region} onChange={(e) => setRegion(e.target.value)} />
            </Field>
            <Field label="Pays">
              <Input value={country} onChange={(e) => setCountry(e.target.value)} />
            </Field>
          </div>
        </div>
        </FormSection>

        <div className="flex justify-end gap-2 pt-2">
          <Link href={`/${slug}/destinations`}>
            <Button variant="outline" size="sm">
              Annuler
            </Button>
          </Link>
          <Button size="sm" onClick={submit} disabled={saving}>
            {saving ? "…" : "Créer"}
          </Button>
        </div>
      </div>
    </DashboardShell>
  );
}
