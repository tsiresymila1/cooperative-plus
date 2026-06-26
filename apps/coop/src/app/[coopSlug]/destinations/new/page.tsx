"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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

const slugify = (s: string) => s.toLowerCase().trim().replace(/\s+/g, "-");

const schema = z.object({
  name: z.string().trim().min(1, "Nom requis"),
  slug: z.string().optional(),
  region: z.string().optional(),
  country: z.string().optional(),
});
type Values = z.infer<typeof schema>;

export default function NewDestinationPage() {
  const { coopId, slug, coop, role, permissions, isPlatformAdmin } = useCoop();
  const router = useRouter();

  const [slugTouched, setSlugTouched] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: { name: "", slug: "", region: "", country: "Madagascar" },
  });
  const destSlug = watch("slug");

  const submit = handleSubmit(async (v) => {
    try {
      const payload: any = { name: v.name.trim(), country: v.country, slug: v.slug || slugify(v.name) };
      if (v.region) payload.region = v.region;
      await db.transact(
        db.tx.destinations[id()]
          .update({ ...payload, isPopular: false, isGlobal: false, createdAt: Date.now() })
          .link({ cooperative: coopId }),
      );
      toast.success("Destination créée");
      router.push(`/${slug}/destinations`);
    } catch (e: any) {
      toast.error("Erreur: " + (e?.message ?? "inconnue"));
    }
  });

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
          <Field label="Nom" error={errors.name?.message}>
            <Input
              {...register("name", {
                onChange: (e) => {
                  if (!slugTouched) setValue("slug", slugify(e.target.value));
                },
              })}
            />
          </Field>
          <Field label="Slug" hint="Identifiant pour les URLs (généré depuis le nom)">
            <Input
              value={destSlug}
              onChange={(e) => {
                setSlugTouched(true);
                setValue("slug", e.target.value);
              }}
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
            {isSubmitting ? "…" : "Créer"}
          </Button>
        </div>
      </div>
    </DashboardShell>
  );
}
