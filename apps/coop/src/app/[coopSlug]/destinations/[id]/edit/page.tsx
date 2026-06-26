"use client";
import { PageSkeleton } from "@cp/ui";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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

const slugify = (s: string) => s.toLowerCase().trim().replace(/\s+/g, "-");

const schema = z.object({
  name: z.string().trim().min(1, "Nom requis"),
  slug: z.string().optional(),
  region: z.string().optional(),
  country: z.string().optional(),
});
type Values = z.infer<typeof schema>;

export default function EditDestinationPage() {
  const { coopId, slug, coop, role, permissions, isPlatformAdmin } = useCoop();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const destinationId = params.id;

  const { data, isLoading } = db.useQuery({
    destinations: { $: { where: { id: destinationId, "cooperative.id": coopId } } },
  });
  const dest = data?.destinations?.[0];

  const [hydrated, setHydrated] = useState(false);

  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: { name: "", slug: "", region: "", country: "Madagascar" },
  });
  const destSlug = watch("slug");

  useEffect(() => {
    if (dest && !hydrated) {
      reset({
        name: dest.name ?? "",
        slug: dest.slug ?? "",
        region: dest.region ?? "",
        country: dest.country ?? "Madagascar",
      });
      setHydrated(true);
    }
  }, [dest, hydrated, reset]);

  const submit = handleSubmit(async (v) => {
    try {
      const payload: any = {
        name: v.name.trim(),
        country: v.country,
        region: v.region || undefined,
        slug: v.slug || slugify(v.name),
      };
      await db.transact(db.tx.destinations[destinationId].update(payload));
      toast.success("Destination mise à jour");
      router.push(`/${slug}/destinations`);
    } catch (e: any) {
      toast.error("Erreur: " + (e?.message ?? "inconnue"));
    }
  });

  return (
    <DashboardShell
      nav={coopNav(slug, "destinations", { role, permissions, isPlatformAdmin })}
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
        <PageSkeleton />
      ) : !dest ? (
        <p className="text-ink-soft">Destination introuvable ou en lecture seule.</p>
      ) : (
        <div className="mx-auto max-w-4xl">
          <FormSection index="01" title="Localisation" description="Nom, région et pays de la destination.">
          <div className="grid gap-4">
            <Field label="Nom" error={errors.name?.message}>
              <Input {...register("name")} />
            </Field>
            <Field label="Slug" hint="Identifiant pour les URLs">
              <Input
                value={destSlug}
                onChange={(e) => setValue("slug", e.target.value)}
                className="font-mono"
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Région">
                <Input {...register("region")} />
              </Field>
              <Field label="Pays">
                <Input {...register("country")} />
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
            <Button size="sm" onClick={submit} disabled={isSubmitting}>
              {isSubmitting ? "…" : "Enregistrer"}
            </Button>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
