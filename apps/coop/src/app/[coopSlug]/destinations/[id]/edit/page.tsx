"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";
import {
  DashboardShell,
  coopNav,
  useCoop,
  db,
  Button,
  FormSection,
  Field,
  toast,
} from "@cp/ui";
import { Input } from "@cp/ui/shadcn";

export default function EditDestinationPage() {
  const { coopId, slug, coop } = useCoop();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const destinationId = params.id;

  const { data, isLoading } = db.useQuery({
    destinations: { $: { where: { id: destinationId, "cooperative.id": coopId } } },
  });
  const dest = data?.destinations?.[0];

  const [hydrated, setHydrated] = useState(false);
  const [name, setName] = useState("");
  const [destSlug, setDestSlug] = useState("");
  const [region, setRegion] = useState("");
  const [country, setCountry] = useState("Madagascar");
  const [saving, setSaving] = useState(false);

  const slugify = (s: string) => s.toLowerCase().trim().replace(/\s+/g, "-");

  useEffect(() => {
    if (dest && !hydrated) {
      setName(dest.name ?? "");
      setDestSlug(dest.slug ?? "");
      setRegion(dest.region ?? "");
      setCountry(dest.country ?? "Madagascar");
      setHydrated(true);
    }
  }, [dest, hydrated]);

  const submit = async () => {
    if (!name) {
      toast.error("Nom requis");
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        name,
        country,
        region: region || undefined,
        slug: destSlug || slugify(name),
      };
      await db.transact(db.tx.destinations[destinationId].update(payload));
      toast.success("Destination mise à jour");
      router.push(`/${slug}/destinations`);
    } catch (e: any) {
      toast.error("Erreur: " + (e?.message ?? "inconnue"));
      setSaving(false);
    }
  };

  return (
    <DashboardShell
      nav={coopNav(slug, "destinations")}
      title="Modifier la destination"
      tenant={coop.displayName}
      logoUrl={coop.logoUrl}
      breadcrumb={
        <>
          <span>{coop.displayName}</span>
          <ChevronRight size={12} />
          <span>Destinations</span>
          <ChevronRight size={12} />
          <span className="text-ink">Modifier</span>
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
      {isLoading ? (
        <p className="text-ink-soft">Chargement…</p>
      ) : !dest ? (
        <p className="text-ink-soft">Destination introuvable ou en lecture seule.</p>
      ) : (
        <div className="mx-auto max-w-4xl">
          <FormSection index="01" title="Localisation" description="Nom, région et pays de la destination.">
          <div className="grid gap-4">
            <Field label="Nom">
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Slug" hint="Identifiant pour les URLs">
              <Input value={destSlug} onChange={(e) => setDestSlug(e.target.value)} className="font-mono" />
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
              {saving ? "…" : "Enregistrer"}
            </Button>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
