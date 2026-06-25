"use client";
import { AdminShell } from "@/components/admin-shell";
import { useMemo, useState } from "react";
import { ChevronRight, Building2, Phone, Mail, MapPin, Sparkles } from "lucide-react";
import {
  adminNav,
  db,
  tx,
  DataTable,
  FilterBar,
  Drawer,
  useConfirm,
  Button,
  Badge,
  Field,
  toast,
  fmtDateTime,
  notDeleted,
  type Column,
} from "@cp/ui";
import { Input, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@cp/ui/shadcn";
import { useCreateCooperative } from "@/lib/queries/cooperatives";

type Req = {
  id: string;
  displayName: string;
  legalName?: string;
  region?: string;
  contactName: string;
  email: string;
  phone: string;
  message?: string;
  status: string;
  createdAt: number | string;
};

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Readable password: no ambiguous chars (0/O/1/l/I).
const genPassword = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

const STATUS_TONE: Record<string, "warning" | "success" | "danger" | "neutral"> = {
  pending: "warning", approved: "success", rejected: "danger",
};
const STATUS_FR: Record<string, string> = { pending: "En attente", approved: "Validée", rejected: "Rejetée" };

export default function RequestsPage() {
  const { data, isLoading } = db.useQuery({ coopRequests: { $: { order: { createdAt: "desc" } } } });
  const confirm = useConfirm();
  const createCoop = useCreateCooperative();

  const [filter, setFilter] = useState("pending");
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState<Req | null>(null);
  const [slug, setSlug] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const rows = useMemo(() => {
    const list = (data?.coopRequests ?? []).filter(notDeleted) as Req[];
    return filter === "all" ? list : list.filter((r) => r.status === filter);
  }, [data, filter]);

  function review(r: Req) {
    setSel(r);
    setSlug(slugify(r.displayName));
    setPassword("");
    setOpen(true);
  }

  async function approve() {
    if (!sel) return;
    if (!slug.trim()) { toast.error("Le slug est requis."); return; }
    if (password.length < 6) { toast.error("Le mot de passe doit faire au moins 6 caractères."); return; }
    setBusy(true);
    try {
      const res: any = await createCoop.mutateAsync({
        slug: slug.trim(),
        displayName: sel.displayName,
        legalName: sel.legalName || sel.displayName,
        region: sel.region || undefined,
        ownerEmail: sel.email,
        ownerName: sel.contactName,
        ownerPassword: password,
      });
      const chunk = tx.coopRequests[sel.id].update({ status: "approved", reviewedAt: Date.now() });
      await db.transact(res?.coopId ? chunk.link({ cooperative: res.coopId }) : chunk);
      toast.success("Coopérative créée — le propriétaire peut se connecter.");
      setOpen(false);
    } catch (e: any) {
      toast.error(e instanceof Error ? e.message : "Échec de la validation.");
    } finally {
      setBusy(false);
    }
  }

  async function reject(r: Req) {
    if (await confirm({ title: "Rejeter la demande ?", message: `${r.displayName} · ${r.email}`, confirmLabel: "Rejeter", tone: "danger" })) {
      await db.transact(tx.coopRequests[r.id].update({ status: "rejected", reviewedAt: Date.now() }));
      toast.success("Demande rejetée.");
    }
  }

  const columns: Column<Req>[] = [
    {
      key: "coop",
      header: "Coopérative",
      render: (r) => (
        <div>
          <p className="font-medium text-ink">{r.displayName}</p>
          <p className="text-xs text-ink-soft/60">{r.contactName} · {r.email}</p>
        </div>
      ),
    },
    { key: "region", header: "Région", render: (r) => r.region ?? "—" },
    { key: "date", header: "Reçue", render: (r) => <span className="text-xs text-ink-soft">{fmtDateTime(r.createdAt)}</span> },
    { key: "status", header: "Statut", render: (r) => <Badge tone={STATUS_TONE[r.status] ?? "neutral"}>{STATUS_FR[r.status] ?? r.status}</Badge> },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (r) => (
        <div className="flex justify-end gap-2">
          {r.status === "pending" ? (
            <>
              <Button size="sm" onClick={() => review(r)}>Examiner</Button>
              <Button size="sm" variant="ghost" className="text-danger hover:bg-danger/10" onClick={() => reject(r)}>Rejeter</Button>
            </>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => review(r)}>Voir</Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <AdminShell
      nav={adminNav("requests")}
      title="Demandes d'inscription"
      tenant="Plateforme"
      breadcrumb={<><span>Plateforme</span><ChevronRight size={12} /><span className="text-ink">Demandes</span></>}
    >
      <FilterBar>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="h-9 w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="approved">Validées</SelectItem>
            <SelectItem value="rejected">Rejetées</SelectItem>
            <SelectItem value="all">Toutes</SelectItem>
          </SelectContent>
        </Select>
      </FilterBar>

      <DataTable columns={columns} rows={rows} loading={isLoading} empty="Aucune demande." />

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title={sel?.displayName ?? "Demande"}
        eyebrow="Demande d'inscription"
        width="max-w-lg"
        footer={sel?.status === "pending" && (
          <div className="flex justify-between gap-2">
            <Button variant="ghost" size="sm" className="text-danger hover:bg-danger/10" onClick={() => { if (sel) reject(sel); setOpen(false); }} disabled={busy}>Rejeter</Button>
            <Button size="sm" onClick={approve} disabled={busy}>{busy ? "…" : "Valider & créer la coopérative"}</Button>
          </div>
        )}
      >
        {sel && (
          <div className="grid gap-5">
            <div className="grid gap-2 rounded-md border border-ink/10 p-4 text-sm">
              <Info icon={<Building2 size={14} />} label="Raison sociale" value={sel.legalName ?? "—"} />
              <Info icon={<MapPin size={14} />} label="Région" value={sel.region ?? "—"} />
              <Info icon={<Mail size={14} />} label="Email" value={sel.email} />
              <Info icon={<Phone size={14} />} label="Téléphone" value={sel.phone} />
              <Info label="Contact" value={sel.contactName} />
              {sel.message && <Info label="Message" value={sel.message} />}
            </div>

            {sel.status === "pending" ? (
              <div className="grid gap-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft/60">Création du compte propriétaire</p>
                <Field label="Slug (URL de la coopérative)">
                  <Input value={slug} onChange={(e) => setSlug(slugify(e.target.value))} placeholder="soatrans-plus" />
                </Field>
                <Field label="Mot de passe propriétaire" hint="Au moins 6 caractères. À communiquer au propriétaire.">
                  <div className="flex gap-2">
                    <Input type="text" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" placeholder="••••••••" className="flex-1" />
                    <Button type="button" variant="outline" size="md" className="shrink-0" onClick={() => setPassword(genPassword())}>
                      <Sparkles size={15} /> Générer
                    </Button>
                  </div>
                </Field>
                <p className="text-xs text-ink-soft">Le compte sera créé pour <span className="font-semibold text-ink">{sel.email}</span> avec le rôle propriétaire.</p>
              </div>
            ) : (
              <Badge tone={STATUS_TONE[sel.status] ?? "neutral"}>{STATUS_FR[sel.status] ?? sel.status}</Badge>
            )}
          </div>
        )}
      </Drawer>
    </AdminShell>
  );
}

function Info({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="flex items-center gap-1.5 text-ink-soft/60">{icon}{label}</span>
      <span className="text-right font-medium text-ink">{value}</span>
    </div>
  );
}
