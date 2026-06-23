"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
} from "@cp/ui";
import { Input } from "@cp/ui/shadcn";

export default function NewTeamMemberPage() {
  const { coopId, slug, coop, role, permissions, isPlatformAdmin } = useCoop();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [perms, setPerms] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const togglePerm = (key: string) =>
    setPerms((p) => (p.includes(key) ? p.filter((x) => x !== key) : [...p, key]));

  const submit = async () => {
    const target = (email || "").trim().toLowerCase();
    if (!target) {
      toast.error("Email requis");
      return;
    }
    if (password.length < 6) {
      toast.error("Mot de passe: 6 caractères minimum");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ coopId, email: target, name, password, permissions: perms }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Échec");
      toast.success("Compte assistant créé");
      router.push(`/${slug}/team`);
    } catch (e: any) {
      toast.error("Erreur: " + (e?.message ?? "inconnue"));
      setSaving(false);
    }
  };

  return (
    <DashboardShell
      nav={coopNav(slug, "team", { role, permissions, isPlatformAdmin })}
      title="Inviter un assistant"
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
          <Field label="Nom">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom de l'assistant" />
          </Field>
          <Field label="Email">
            <div className="relative">
              <Mail size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft/60" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="assistant@exemple.com"
                className="pl-9"
              />
            </div>
          </Field>
          <Field label="Mot de passe" hint="6 caractères minimum">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />
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
          <Button size="sm" onClick={submit} disabled={saving}>
            {saving ? "…" : "Ajouter"}
          </Button>
        </div>
      </div>
    </DashboardShell>
  );
}
