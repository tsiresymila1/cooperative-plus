"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, ChevronRight, Mail } from "lucide-react";
import {
  DashboardShell,
  coopNav,
  useCoop,
  Button,
  FormSection,
  Field,
  toast,
  COOP_PERMISSIONS,
  useCoopPlan,
  logActivity,
} from "@cp/ui";
import { Input } from "@cp/ui/shadcn";
import { useCreateAssistant } from "@/lib/queries/account";

const schema = z.object({
  name: z.string().optional(),
  email: z.string().trim().min(1, "Email requis").email("Email invalide"),
  password: z.string().min(6, "Mot de passe: 6 caractères minimum"),
});
type Values = z.infer<typeof schema>;

export default function NewTeamMemberPage() {
  const { coopId, slug, coop, role, permissions, isPlatformAdmin, userId } = useCoop();
  const router = useRouter();
  const createAssistant = useCreateAssistant();
  const saving = createAssistant.isPending;
  const { overLimit, max } = useCoopPlan(coopId);

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: { name: "", email: "", password: "" },
  });
  const password = watch("password");

  const [perms, setPerms] = useState<string[]>([]);
  const togglePerm = (key: string) =>
    setPerms((p) => (p.includes(key) ? p.filter((x) => x !== key) : [...p, key]));

  const generatePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    let out = "";
    for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)];
    setValue("password", out, { shouldValidate: true });
  };

  const submit = handleSubmit(async (v) => {
    if (overLimit("assistants")) { toast.error(`Limite du plan atteinte (${max.assistants} assistants). Changez de plan dans Abonnement.`); return; }
    createAssistant.mutate(
      { coopId, email: v.email.trim().toLowerCase(), name: v.name ?? "", password: v.password, permissions: perms },
      {
        onSuccess: () => { logActivity({ coopId, actorId: userId, action: "create", entityType: "assistant", label: v.email.trim() }); toast.success("Compte assistant créé"); router.push(`/${slug}/team`); },
        onError: (e) => toast.error("Erreur: " + (e instanceof Error ? e.message : "inconnue")),
      },
    );
  });

  return (
    <DashboardShell
      nav={coopNav(slug, "team", { role, permissions, isPlatformAdmin })}
      title="Ajouter un assistant"
      tenant={coop.displayName}
      logoUrl={coop.logoUrl}
      breadcrumb={
        <>
          <span>{coop.displayName}</span>
          <ChevronRight size={12} />
          <span>Équipe</span>
          <ChevronRight size={12} />
          <span className="text-ink">Inviter</span>
        </>
      }
      action={
        <Link href={`/${slug}/team`}>
          <Button size="sm" variant="outline">
            <ArrowLeft size={16} /> Retour
          </Button>
        </Link>
      }
    >
      <div className="mx-auto max-w-4xl">
        <FormSection index="01" title="Compte" description="Un compte assistant avec mot de passe sera créé.">
        <div className="grid gap-4">
          <Field label="Nom" error={errors.name?.message}>
            <Input {...register("name")} placeholder="Nom de l'assistant" />
          </Field>
          <Field label="Email" error={errors.email?.message}>
            <div className="relative">
              <Mail size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft/60" />
              <Input
                type="email"
                {...register("email")}
                placeholder="assistant@exemple.com"
                className="pl-9"
              />
            </div>
          </Field>
          <Field label="Mot de passe" hint="6 caractères minimum" error={errors.password?.message}>
            <div className="flex gap-2">
              <Input
                type="text"
                value={password}
                onChange={(e) => setValue("password", e.target.value, { shouldValidate: true })}
                placeholder="••••••••"
                autoComplete="new-password"
                className="font-mono"
              />
              <Button size="sm" variant="outline" type="button" onClick={generatePassword}>
                Générer
              </Button>
            </div>
          </Field>
        </div>
        </FormSection>

        <FormSection index="02" title="Permissions" description="Sélectionnez les actions autorisées pour cet assistant.">
          <div className="grid grid-cols-2 gap-2">
            {COOP_PERMISSIONS.map((p) => (
              <label key={p.key} className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={perms.includes(p.key)}
                  onChange={() => togglePerm(p.key)}
                  className="h-4 w-4 accent-laterite"
                />
                {p.label}
              </label>
            ))}
          </div>
        </FormSection>

        <div className="flex justify-end gap-2 pt-2">
          <Link href={`/${slug}/team`}>
            <Button variant="outline" size="sm">
              Annuler
            </Button>
          </Link>
          <Button size="sm" onClick={submit} disabled={isSubmitting || saving}>
            {isSubmitting || saving ? "…" : "Ajouter"}
          </Button>
        </div>
      </div>
    </DashboardShell>
  );
}
