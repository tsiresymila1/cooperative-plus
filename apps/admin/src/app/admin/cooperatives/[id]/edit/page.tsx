"use client";
import { AdminShell } from "@/components/admin-shell";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronRight, Power, Trash2, UserPlus } from "lucide-react";
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
        <p className="text-ink-soft">Chargement…</p>
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
        <InfoSections coop={coop} plans={plans} sub={sub} />
        <AccountsSection coopId={id} members={coop.members ?? []} />
      </div>
    </Shell>
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
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const add = async () => {
    if (!form.email.trim()) {
      toast.error("Email requis.");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Le mot de passe doit faire au moins 6 caractères.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/cooperatives/${coopId}/accounts`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Échec.");
      toast.success("Compte attaché.");
      setForm({ email: "", name: "", password: "", role: "owner" });
    } catch (e: any) {
      toast.error(e?.message ?? "Échec.");
    } finally {
      setSaving(false);
    }
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
        <p className="mb-3 flex items-center gap-2 text-sm font-medium text-ink">
          <UserPlus size={15} /> Ajouter un compte
        </p>
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
      </div>
    </FormSection>
  );
}
