"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight, Mail, CheckCircle2, XCircle } from "lucide-react";
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
  COOP_PERMISSIONS,
} from "@cp/ui";
import { Input } from "@cp/ui/shadcn";

export default function NewTeamMemberPage() {
  const { coopId, slug, coop } = useCoop();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [lookupEmail, setLookupEmail] = useState("");
  const [perms, setPerms] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const { data } = db.useQuery(
    lookupEmail ? { $users: { $: { where: { email: lookupEmail } } } } : null,
  );
  const found = lookupEmail ? data?.$users?.[0] : null;

  const togglePerm = (key: string) =>
    setPerms((p) => (p.includes(key) ? p.filter((x) => x !== key) : [...p, key]));

  const submit = async () => {
    const target = (email || "").trim().toLowerCase();
    if (!target) {
      toast.error("Email requis");
      return;
    }
    if (lookupEmail !== target) {
      setLookupEmail(target);
      toast.info("Vérification de l'utilisateur, réessayez.");
      return;
    }
    if (!found) {
      toast.error("Utilisateur introuvable, il doit créer un compte d'abord");
      return;
    }
    setSaving(true);
    try {
      await db.transact(
        db.tx.memberships[id()]
          .update({
            role: "assistant",
            status: "active",
            permissions: perms,
            createdAt: Date.now(),
          })
          .link({ cooperative: coopId, user: found.id }),
      );
      toast.success("Assistant ajouté");
      router.push(`/${slug}/team`);
    } catch (e: any) {
      toast.error("Erreur: " + (e?.message ?? "inconnue"));
      setSaving(false);
    }
  };

  return (
    <DashboardShell
      nav={coopNav(slug, "team")}
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
        <FormSection index="01" title="Compte" description="L'utilisateur doit déjà avoir un compte Cooperative Plus.">
        <div className="grid gap-4">
          <Field label="Email">
            <div className="relative">
              <Mail size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft/60" />
              <Input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setLookupEmail(e.target.value.trim().toLowerCase());
                }}
                placeholder="assistant@exemple.com"
                className="pl-9"
              />
            </div>
          </Field>
          {lookupEmail && (
            <p className="flex items-center gap-1.5 text-xs">
              {found ? (
                <span className="inline-flex items-center gap-1.5 text-baobab">
                  <CheckCircle2 size={14} /> Utilisateur trouvé: {found.name ?? found.email}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-laterite">
                  <XCircle size={14} /> Aucun compte avec cet email.
                </span>
              )}
            </p>
          )}
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
