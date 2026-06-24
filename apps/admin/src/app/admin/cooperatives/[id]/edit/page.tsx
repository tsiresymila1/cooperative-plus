"use client";
import { PageSkeleton } from "@cp/ui";
import { AdminShell } from "@/components/admin-shell";
import { useCreateCoopAccount } from "@/lib/queries/cooperatives";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, ChevronRight, Power, Trash2, UserPlus } from "lucide-react";
import {
  adminNav,
  db,
  tx,
  id as newId,
  Button,
  Badge,
  FormSection,
  Field,
  ImageUpload,
  DataTable,
  useConfirm,
  toast,
  toInt,
  toFloat,
  memberRole,
  type Column,
} from "@cp/ui";
import {
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@cp/ui/shadcn";

export default function EditCooperativePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading } = db.useQuery({
    cooperatives: {
      $: { where: { id } },
      subscriptions: { plan: {} },
      members: { user: {} },
    },
    plans: {},
  });
  const coop = data?.cooperatives?.[0];
  const plans = (data?.plans ?? []).filter((p: any) => p.isActive);
  const sub = (coop?.subscriptions ?? [])[0];

  if (isLoading) {
    return (
      <Shell coop={coop}>
        <PageSkeleton />
      </Shell>
    );
  }
  if (!coop) {
    return (
      <Shell coop={coop}>
        <p className="text-ink-soft">Coopérative introuvable.</p>
      </Shell>
    );
  }

  return (
    <Shell coop={coop}>
      <div className="mx-auto max-w-4xl">
        {coop.subscriptionStatus === "suspended" && (
          <div className="mb-6 flex items-start gap-3 rounded-md border border-danger/30 bg-danger/10 px-4 py-3.5 text-danger">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-semibold">Coopérative suspendue</p>
              <p className="text-danger/80">Le propriétaire et les assistants sont bloqués, et ses trajets sont masqués côté voyageurs. Réactivez-la pour rétablir l&apos;accès.</p>
            </div>
          </div>
        )}
        <InfoSections coop={coop} plans={plans} sub={sub} />
        <AccountsSection coopId={id} members={coop.members ?? []} />
        <DangerZone coop={coop} />
      </div>
    </Shell>
  );
}

function DangerZone({ coop }: { coop: any }) {
  const confirm = useConfirm();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const suspended = coop.subscriptionStatus === "suspended";

  async function toggleSuspend() {
    const ok = await confirm({
      title: suspended ? "Réactiver la coopérative ?" : "Suspendre la coopérative ?",
      message: suspended
        ? "Les membres retrouveront l'accès et ses trajets redeviendront visibles côté voyageurs."
        : "Le propriétaire et les assistants seront bloqués, et ses trajets masqués côté voyageurs.",
      confirmLabel: suspended ? "Réactiver" : "Suspendre",
      tone: suspended ? "default" : "danger",
    });
    if (!ok) return;
    setBusy(true);
    try {
      await db.transact(tx.cooperatives[coop.id].update({ subscriptionStatus: suspended ? "active" : "suspended" }));
      toast.success(suspended ? "Coopérative réactivée." : "Coopérative suspendue.");
    } catch (e: any) {
      toast.error(e?.message ?? "Échec.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    const ok = await confirm({
      title: "Supprimer définitivement ?",
      message: `${coop.displayName} et tous ses accès seront supprimés. Action irréversible.`,
      confirmLabel: "Supprimer définitivement",
      tone: "danger",
    });
    if (!ok) return;
    setBusy(true);
    try {
      // ponytail: delete coop + its memberships/subscriptions; orphan trips/bookings
      // stay hidden since every query is scoped by cooperative.
      await db.transact([
        ...(coop.members ?? []).map((m: any) => tx.memberships[m.id].delete()),
        ...(coop.subscriptions ?? []).map((s: any) => tx.subscriptions[s.id].delete()),
        tx.cooperatives[coop.id].delete(),
      ]);
      toast.success("Coopérative supprimée définitivement.");
      router.push("/admin/cooperatives");
    } catch (e: any) {
      toast.error(e?.message ?? "Échec de la suppression.");
      setBusy(false);
    }
  }

  return (
    <FormSection index="03" title="Zone de danger" description="Suspendre l'accès ou supprimer définitivement la coopérative.">
      <div className="divide-y divide-ink/8 rounded-md border border-danger/25">
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-ink">{suspended ? "Réactiver la coopérative" : "Suspendre la coopérative"}</p>
            <p className="mt-0.5 text-xs text-ink-soft">{suspended ? "Rétablit l'accès des membres et la visibilité des trajets." : "Bloque les membres et masque les trajets côté voyageurs."}</p>
          </div>
          <Button variant="outline" size="sm" onClick={toggleSuspend} disabled={busy} className="shrink-0">
            <Power size={15} /> {suspended ? "Réactiver" : "Suspendre"}
          </Button>
        </div>
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-danger">Supprimer définitivement</p>
            <p className="mt-0.5 text-xs text-ink-soft">Action irréversible. La coopérative et ses accès seront supprimés.</p>
          </div>
          <Button size="sm" onClick={remove} disabled={busy} className="shrink-0 bg-danger text-white hover:bg-danger/90">
            <Trash2 size={15} /> Supprimer
          </Button>
        </div>
      </div>
    </FormSection>
  );
}

function Shell({ coop, children }: { coop: any; children: React.ReactNode }) {
  return (
    <AdminShell
      nav={adminNav("cooperatives")}
      title="Modifier la coopérative"
      tenant="Plateforme"
      breadcrumb={
        <>
          <span>Plateforme</span>
          <ChevronRight size={12} />
          <Link href="/admin/cooperatives">Coopératives</Link>
          <ChevronRight size={12} />
          <span className="text-ink">{coop?.displayName ?? "…"}</span>
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
      {children}
    </AdminShell>
  );
}

function InfoSections({ coop, plans, sub }: { coop: any; plans: any[]; sub: any }) {
  const [form, setForm] = useState({
    slug: "",
    displayName: "",
    legalName: "",
    region: "",
    phone: "",
    email: "",
    address: "",
    cutoffHours: "0",
    refundPct: "0",
    planId: "",
  });
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    setForm({
      slug: coop.slug ?? "",
      displayName: coop.displayName ?? "",
      legalName: coop.legalName ?? "",
      region: coop.region ?? "",
      phone: coop.phone ?? "",
      email: coop.email ?? "",
      address: coop.address ?? "",
      cutoffHours: String(coop.cutoffHours ?? 0),
      refundPct: String(coop.refundPct ?? 0),
      planId: sub?.plan?.id ?? "",
    });
  }, [coop, sub]);

  const onLogo = async (file: File) => {
    try {
      const res = await db.storage.uploadFile(`coops/${coop.id}/logo-${Date.now()}-${file.name}`, file);
      const q = await db.queryOnce({ $files: { $: { where: { id: (res as any).data.id } } } });
      const url = q.data?.$files?.[0]?.url;
      if (url) await db.transact(tx.cooperatives[coop.id].update({ logoUrl: url }));
      toast.success("Logo mis à jour");
    } catch (err: any) {
      toast.error("Échec de l'upload: " + (err?.message ?? "inconnu"));
    }
  };

  const save = async () => {
    if (!form.slug.trim() || !form.displayName.trim() || !form.legalName.trim()) {
      toast.error("Slug, nom commercial et raison sociale sont requis.");
      return;
    }
    setSaving(true);
    try {
      const chunks: any[] = [
        tx.cooperatives[coop.id].update({
          slug: form.slug.trim().toLowerCase(),
          displayName: form.displayName.trim(),
          legalName: form.legalName.trim(),
          region: form.region.trim() || undefined,
          phone: form.phone.trim() || undefined,
          email: form.email.trim() || undefined,
          address: form.address.trim() || undefined,
          cutoffHours: toInt(form.cutoffHours),
          refundPct: toFloat(form.refundPct),
        }),
      ];
      // Plan change → upsert subscription link.
      if (form.planId && form.planId !== (sub?.plan?.id ?? "")) {
        const subId = sub?.id ?? newId();
        chunks.push(
          tx.subscriptions[subId]
            .update({ status: sub?.status ?? "active", createdAt: sub?.createdAt ?? Date.now() })
            .link({ cooperative: coop.id, plan: form.planId }),
        );
      }
      await db.transact(chunks);
      toast.success("Coopérative mise à jour.");
    } catch (e: any) {
      toast.error(e?.message ?? "Échec de la mise à jour.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <FormSection index="01" title="Identité" description="Nom, logo et coordonnées de la coopérative.">
        <div className="grid gap-4">
          <ImageUpload value={coop.logoUrl} onFile={onLogo} />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Slug">
              <Input value={form.slug} onChange={(e) => set("slug", e.target.value)} />
            </Field>
            <Field label="Nom commercial">
              <Input value={form.displayName} onChange={(e) => set("displayName", e.target.value)} />
            </Field>
          </div>
          <Field label="Raison sociale">
            <Input value={form.legalName} onChange={(e) => set("legalName", e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Téléphone">
              <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </Field>
            <Field label="Email">
              <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
            </Field>
          </div>
          <Field label="Adresse">
            <Input value={form.address} onChange={(e) => set("address", e.target.value)} />
          </Field>
          <Field label="Région">
            <Input value={form.region} onChange={(e) => set("region", e.target.value)} />
          </Field>
        </div>
      </FormSection>

      <FormSection index="02" title="Abonnement & réservation" description="Formule, délai limite et remboursement.">
        <div className="grid gap-4">
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
          <div className="grid grid-cols-2 gap-4">
            <Field label="Heures limite avant départ">
              <Input inputMode="numeric" value={form.cutoffHours} onChange={(e) => set("cutoffHours", e.target.value)} />
            </Field>
            <Field label="% de remboursement">
              <Input inputMode="numeric" value={form.refundPct} onChange={(e) => set("refundPct", e.target.value)} />
            </Field>
          </div>
          <div className="flex justify-end">
            <Button size="sm" onClick={save} disabled={saving}>
              {saving ? "…" : "Enregistrer"}
            </Button>
          </div>
        </div>
      </FormSection>
    </>
  );
}

function AccountsSection({ coopId, members }: { coopId: string; members: any[] }) {
  const confirm = useConfirm();
  const [form, setForm] = useState({ email: "", name: "", password: "", role: "owner" });
  const createAccount = useCreateCoopAccount();
  const saving = createAccount.isPending;
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  // Attach an already-existing user (no new credentials) vs. create a fresh account.
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [pick, setPick] = useState({ userId: "", role: "assistant" });
  const { data: usersData } = db.useQuery({ $users: {} });
  const memberIds = new Set((members ?? []).map((m: any) => m.user?.id));
  const candidates = (usersData?.$users ?? []).filter((u: any) => !memberIds.has(u.id));

  const attachExisting = async () => {
    if (!pick.userId) { toast.error("Sélectionnez un utilisateur."); return; }
    try {
      await db.transact(
        tx.memberships[newId()]
          .update({ role: pick.role, permissions: [], status: "active", createdAt: Date.now() })
          .link({ cooperative: coopId, user: pick.userId }),
      );
      toast.success("Utilisateur rattaché.");
      setPick({ userId: "", role: "assistant" });
    } catch (e: any) {
      toast.error(e?.message ?? "Échec du rattachement.");
    }
  };

  const add = () => {
    if (!form.email.trim()) { toast.error("Email requis."); return; }
    if (form.password.length < 6) { toast.error("Le mot de passe doit faire au moins 6 caractères."); return; }
    createAccount.mutate(
      { coopId, email: form.email, name: form.name, password: form.password, role: form.role as "owner" | "assistant" },
      {
        onSuccess: () => { toast.success("Compte attaché."); setForm({ email: "", name: "", password: "", role: "owner" }); },
        onError: (e) => toast.error(e instanceof Error ? e.message : "Échec."),
      },
    );
  };

  const toggle = async (r: any) => {
    await db.transact(
      tx.memberships[r.id].update({ status: r.status === "active" ? "disabled" : "active" }),
    );
    toast.success(r.status === "active" ? "Compte désactivé" : "Compte activé");
  };

  const remove = async (r: any) => {
    if (
      await confirm({
        title: "Retirer ce compte ?",
        message: `${r.user?.email ?? ""} perdra l'accès à cette coopérative.`,
        confirmLabel: "Retirer",
        tone: "danger",
      })
    ) {
      await db.transact(tx.memberships[r.id].delete());
      toast.success("Compte retiré");
    }
  };

  const columns: Column<any>[] = [
    {
      key: "name",
      header: "Compte",
      render: (r) => (
        <div>
          <p className="font-medium text-ink">{r.user?.name ?? r.user?.email ?? "—"}</p>
          <p className="text-xs text-ink-soft/60">{r.user?.email}</p>
        </div>
      ),
    },
    { key: "role", header: "Rôle", render: (r) => memberRole[r.role] ?? r.role },
    {
      key: "status",
      header: "Statut",
      render: (r) => (
        <Badge tone={r.status === "active" ? "success" : "neutral"}>
          {r.status === "active" ? "actif" : "désactivé"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (r) => (
        <div className="flex justify-end gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-within:opacity-100">
          <Button size="sm" variant="ghost" onClick={() => toggle(r)}>
            <Power size={14} /> {r.status === "active" ? "Désactiver" : "Activer"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => remove(r)}>
            <Trash2 size={14} /> Retirer
          </Button>
        </div>
      ),
    },
  ];

  return (
    <FormSection
      index="03"
      title="Comptes"
      description="Comptes rattachés à cette coopérative (connexion email + mot de passe sur l'app coopérative)."
    >
      <div className="mb-6">
        <DataTable columns={columns} rows={members} empty="Aucun compte rattaché." pageSize={100} />
      </div>

      <div className="rounded-[--radius] border border-ink/10 p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm font-medium text-ink">
            <UserPlus size={15} /> Ajouter un compte
          </p>
          <div className="flex gap-0.5 rounded-lg bg-ink/5 p-0.5 text-xs font-medium">
            <button type="button" onClick={() => setMode("existing")}
              className={mode === "existing" ? "rounded-md bg-paper px-3 py-1.5 text-ink shadow-sm" : "px-3 py-1.5 text-ink-soft"}>
              Utilisateur existant
            </button>
            <button type="button" onClick={() => setMode("new")}
              className={mode === "new" ? "rounded-md bg-paper px-3 py-1.5 text-ink shadow-sm" : "px-3 py-1.5 text-ink-soft"}>
              Nouveau compte
            </button>
          </div>
        </div>

        {mode === "existing" ? (
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Utilisateur">
                <Select value={pick.userId || undefined} onValueChange={(v) => setPick((p) => ({ ...p, userId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder={candidates.length ? "Choisir un utilisateur…" : "Aucun utilisateur disponible"} />
                  </SelectTrigger>
                  <SelectContent>
                    {candidates.map((u: any) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name ? `${u.name} · ${u.email}` : u.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Rôle">
                <Select value={pick.role} onValueChange={(v) => setPick((p) => ({ ...p, role: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">Propriétaire</SelectItem>
                    <SelectItem value="assistant">Assistant</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <div className="flex justify-end">
              <Button size="sm" onClick={attachExisting} disabled={!candidates.length}>Rattacher</Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Email">
                <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="compte@exemple.mg" />
              </Field>
              <Field label="Nom">
                <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Rakoto Jean" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Mot de passe" hint="Au moins 6 caractères.">
                <Input type="password" value={form.password} onChange={(e) => set("password", e.target.value)} autoComplete="new-password" placeholder="••••••••" />
              </Field>
              <Field label="Rôle">
                <Select value={form.role} onValueChange={(v) => set("role", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">Propriétaire</SelectItem>
                    <SelectItem value="assistant">Assistant</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <div className="flex justify-end">
              <Button size="sm" onClick={add} disabled={saving}>
                {saving ? "…" : "Ajouter le compte"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </FormSection>
  );
}
