"use client";
import { PageSkeleton } from "@cp/ui";
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
  toast,
  COOP_PERMISSIONS,
  logActivity,
} from "@cp/ui";

export default function MemberPermissionsPage() {
  const { coopId, slug, coop, role, permissions, isPlatformAdmin, userId } = useCoop();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const membershipId = params.id;

  const { data, isLoading } = db.useQuery({
    memberships: { $: { where: { id: membershipId, "cooperative.id": coopId } }, user: {} },
  });
  const member = data?.memberships?.[0];

  const [hydrated, setHydrated] = useState(false);
  const [perms, setPerms] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (member && !hydrated) {
      setPerms((member.permissions as string[]) ?? []);
      setHydrated(true);
    }
  }, [member, hydrated]);

  const togglePerm = (key: string) =>
    setPerms((p) => (p.includes(key) ? p.filter((x) => x !== key) : [...p, key]));

  const submit = async () => {
    setSaving(true);
    try {
      await db.transact(db.tx.memberships[membershipId].update({ permissions: perms }));
      logActivity({ coopId, actorId: userId, action: "update", entityType: "assistant", entityId: membershipId, label: member?.user?.email ?? member?.user?.name });
      toast.success("Permissions mises à jour");
      router.push(`/${slug}/team`);
    } catch (e: any) {
      toast.error("Erreur: " + (e?.message ?? "inconnue"));
      setSaving(false);
    }
  };

  return (
    <DashboardShell
      nav={coopNav(slug, "team", { role, permissions, isPlatformAdmin })}
      title="Permissions"
      tenant={coop.displayName}
      logoUrl={coop.logoUrl}
      breadcrumb={
        <>
          <span>{coop.displayName}</span>
          <ChevronRight size={12} />
          <span>Équipe</span>
          <ChevronRight size={12} />
          <span className="text-ink">Permissions</span>
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
      {isLoading ? (
        <PageSkeleton />
      ) : !member ? (
        <p className="text-ink-soft">Membre introuvable.</p>
      ) : (
        <div className="mx-auto max-w-4xl">
          <FormSection index="01" title="Permissions" description={member.user?.email ?? "Actions autorisées pour ce membre."}>
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
              {saving ? "…" : "Enregistrer"}
            </Button>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
