"use client";
import { AdminShell } from "@/components/admin-shell";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, ChevronRight } from "lucide-react";
import {
  adminNav,
  db,
  tx,
  DataTable,
  FilterBar,
  useConfirm,
  Button,
  Badge,
  toast,
  notDeleted,
  subStatus,
  fmtDate,
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

type Coop = {
  id: string;
  slug: string;
  displayName: string;
  legalName: string;
  region?: string;
  subscriptionStatus: string;
  createdAt: number | string;
  subscriptions?: any[];
};

const STATUS_OPTIONS = [
  { value: "", label: "Tous les statuts" },
  { value: "active", label: "Actif" },
  { value: "trialing", label: "Essai" },
  { value: "past_due", label: "Impayé" },
  { value: "suspended", label: "Suspendu" },
  { value: "cancelled", label: "Résilié" },
];

const COOP_URL = process.env.NEXT_PUBLIC_COOP_URL ?? "http://localhost:3001";

export default function CooperativesPage() {
  const { data, isLoading } = db.useQuery({
    cooperatives: { subscriptions: { plan: {} } },
  });
  const { user } = db.useAuth();
  const confirm = useConfirm();

  // Open a coop's space already signed in: hand the admin's own token to the
  // coop app, which exchanges it via signInWithToken (platform admin → allowed).
  const openCoop = (slug: string) => {
    const token = (user as { refresh_token?: string } | null)?.refresh_token;
    const next = `/${slug}/dashboard`;
    const url = token
      ? `${COOP_URL}/connect?token=${encodeURIComponent(token)}&next=${encodeURIComponent(next)}`
      : `${COOP_URL}${next}`;
    window.open(url, "_blank", "noopener");
  };

  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const rows = useMemo(() => {
    const list = (data?.cooperatives ?? []).filter(notDeleted) as Coop[];
    const q = search.trim().toLowerCase();
    return list.filter((c) => {
      if (status && c.subscriptionStatus !== status) return false;
      if (q) {
        const hay = `${c.displayName} ${c.legalName} ${c.slug} ${c.region ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [data, status, search]);

  async function handleToggleSuspend(target: Coop) {
    const suspended = target.subscriptionStatus === "suspended";
    const next = suspended ? "active" : "suspended";
    const ok = await confirm({
      title: suspended ? "Réactiver la coopérative ?" : "Suspendre la coopérative ?",
      message: suspended
        ? `${target.displayName} pourra de nouveau opérer.`
        : `${target.displayName} sera suspendue : ses membres ne pourront plus se connecter et ses trajets disparaîtront de la recherche client.`,
      confirmLabel: suspended ? "Réactiver" : "Suspendre",
      tone: suspended ? "default" : "danger",
    });
    if (!ok) return;
    setSaving(true);
    try {
      await db.transact(tx.cooperatives[target.id].update({ subscriptionStatus: next }));
      toast.success(next === "suspended" ? "Coopérative suspendue." : "Coopérative réactivée.");
    } catch (e: any) {
      toast.error(e?.message ?? "Échec.");
    } finally {
      setSaving(false);
    }
  }

  const columns: Column<Coop>[] = [
    {
      key: "name",
      header: "Coopérative",
      render: (c) => (
        <div>
          <div className="font-medium text-ink">{c.displayName}</div>
          <div className="text-xs text-ink-soft/60">{c.slug}</div>
        </div>
      ),
    },
    { key: "legal", header: "Raison sociale", render: (c) => c.legalName },
    {
      key: "region",
      header: "Région",
      render: (c) => c.region ?? <span className="text-ink-soft/40">—</span>,
    },
    {
      key: "plan",
      header: "Plan",
      render: (c) => {
        const sub = c.subscriptions?.[0];
        return sub?.plan?.name ?? <span className="text-ink-soft/40">—</span>;
      },
    },
    {
      key: "status",
      header: "Statut",
      render: (c) => {
        const meta = subStatus[c.subscriptionStatus];
        return <Badge tone={meta?.tone ?? "neutral"}>{meta?.label ?? c.subscriptionStatus}</Badge>;
      },
    },
    { key: "created", header: "Créée le", render: (c) => fmtDate(c.createdAt) },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (c) => (
        <div className="flex justify-end gap-2 opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-within:opacity-100">
          <Button variant="ink" size="sm" onClick={() => openCoop(c.slug)}><ExternalLink size={14} /> Ouvrir</Button>
          <Link href={`/admin/cooperatives/${c.id}/edit`}>
            <Button variant="ghost" size="sm">Modifier</Button>
          </Link>
          <Button
            variant={c.subscriptionStatus === "suspended" ? "primary" : "outline"}
            size="sm"
            disabled={saving}
            onClick={() => handleToggleSuspend(c)}
          >
            {c.subscriptionStatus === "suspended" ? "Réactiver" : "Suspendre"}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AdminShell
      nav={adminNav("cooperatives")}
      title="Coopératives"
      tenant="Plateforme"
      breadcrumb={
        <>
          <span>Plateforme</span>
          <ChevronRight size={12} />
          <span className="text-ink">Coopératives</span>
        </>
      }
      action={
        <Link href="/admin/cooperatives/new">
          <Button size="sm">Nouvelle coopérative</Button>
        </Link>
      }
    >
      <FilterBar>
        <Input
          placeholder="Rechercher…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 max-w-xs"
        />
        <Select value={status || "all"} onValueChange={(v) => setStatus(v === "all" ? "" : v)}>
          <SelectTrigger className="h-9 w-44">
            <SelectValue placeholder="Tous les statuts" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value || "all"}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterBar>

      <DataTable columns={columns} rows={rows} loading={isLoading} empty="Aucune coopérative." />
    </AdminShell>
  );
}
