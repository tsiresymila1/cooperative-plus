"use client";

import { useMemo, useState } from "react";
import { ImageIcon, MessageSquareText, Star } from "lucide-react";
import {
  AdminShell,
} from "@/components/admin-shell";
import {
  Badge,
  Button,
  DataTable,
  Drawer,
  Field,
  FilterBar,
  adminNav,
  db,
  fmtDateTime,
  tx,
  type Column,
  Textarea,
} from "@cp/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@cp/ui/shadcn";

type Kind = "product" | "review";
type FeedbackRow = {
  id: string;
  kind: Kind;
  name: string;
  email: string;
  body: string;
  status: string;
  createdAt: number | string;
  screenshotUrl?: string;
  adminNote?: string;
  category?: string;
  source?: string;
  rating?: number;
  cooperative?: { displayName?: string };
  tripInstance?: { originName?: string; destName?: string };
  booking?: { reference?: string };
};

const STATUS_LABELS: Record<string, string> = { new: "Nouveau", in_progress: "En cours", resolved: "Résolu", closed: "Fermé" };
const CATEGORY_LABELS: Record<string, string> = { bug: "Bug", suggestion: "Suggestion", difficulty: "Difficulté", other: "Autre" };
const SOURCE_LABELS: Record<string, string> = { client_web: "Client web", coop_web: "Coop", mobile: "Mobile" };

export default function AdminFeedbackPage() {
  const [kind, setKind] = useState<Kind>("product");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<FeedbackRow | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const { data, isLoading } = db.useQuery({
    productFeedbacks: { $: { order: { createdAt: "desc" } }, cooperative: {} },
    tripReviews: { $: { order: { createdAt: "desc" } }, cooperative: {}, tripInstance: {}, booking: {} },
  });

  const rows = useMemo<FeedbackRow[]>(() => {
    const source = kind === "product"
      ? (data?.productFeedbacks ?? []).map((item: any) => ({ ...item, kind: "product" as const, body: item.message }))
      : (data?.tripReviews ?? []).map((item: any) => ({ ...item, kind: "review" as const, body: item.comment }));
    return status === "all" ? source : source.filter((item) => item.status === status);
  }, [data, kind, status]);

  function open(row: FeedbackRow) {
    setSelected(row);
    setAdminNote(row.adminNote ?? "");
  }

  async function updateStatus(nextStatus: string) {
    if (!selected) return;
    const mutation = selected.kind === "product"
      ? tx.productFeedbacks[selected.id].update({ status: nextStatus, adminNote: adminNote.trim() || undefined, updatedAt: Date.now() })
      : tx.tripReviews[selected.id].update({ status: nextStatus, adminNote: adminNote.trim() || undefined, updatedAt: Date.now() });
    await db.transact(mutation);
    setSelected({ ...selected, status: nextStatus, adminNote });
  }

  const columns: Column<FeedbackRow>[] = [
    { key: "author", header: "Auteur", render: (row) => <div><p className="font-medium text-ink">{row.name}</p><p className="text-xs text-ink-soft">{row.email}</p></div> },
    { key: "type", header: kind === "product" ? "Type" : "Note", render: (row) => row.kind === "product" ? <Badge>{CATEGORY_LABELS[row.category ?? ""] ?? row.category}</Badge> : <span className="inline-flex items-center gap-1 font-semibold text-warning"><Star size={14} className="fill-current" />{row.rating}/5</span> },
    { key: "context", header: "Contexte", render: (row) => <div className="text-sm"><p>{row.cooperative?.displayName ?? (row.source ? SOURCE_LABELS[row.source] : "—")}</p>{row.booking?.reference && <p className="font-mono text-xs text-ink-soft">{row.booking.reference}</p>}</div> },
    { key: "date", header: "Reçu", render: (row) => <span className="text-xs text-ink-soft">{fmtDateTime(row.createdAt)}</span> },
    { key: "status", header: "Statut", render: (row) => <Badge tone={row.status === "new" ? "warning" : row.status === "resolved" ? "success" : "neutral"}>{STATUS_LABELS[row.status] ?? row.status}</Badge> },
    { key: "action", header: "", className: "text-right", render: (row) => <Button size="sm" variant="ghost" onClick={() => open(row)}>Consulter</Button> },
  ];

  return (
    <AdminShell nav={adminNav("feedback")} title="Feedbacks" subtitle="Retours sur la plateforme et avis vérifiés sur les trajets.">
      <FilterBar>
        <div className="flex rounded-lg border border-line bg-paper p-1">
          <Button size="sm" variant={kind === "product" ? "primary" : "ghost"} onClick={() => setKind("product")}><MessageSquareText size={15} /> Plateforme</Button>
          <Button size="sm" variant={kind === "review" ? "primary" : "ghost"} onClick={() => setKind("review")}><Star size={15} /> Avis trajets</Button>
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-9 w-44"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">Tous les statuts</SelectItem>{Object.entries(STATUS_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
        </Select>
      </FilterBar>
      <DataTable rows={rows} columns={columns} loading={isLoading} empty="Aucun feedback pour ce filtre." />
      <Drawer open={!!selected} onClose={() => setSelected(null)} title={selected?.kind === "review" ? "Avis sur le trajet" : "Feedback plateforme"} eyebrow={selected ? fmtDateTime(selected.createdAt) : undefined} width="max-w-xl">
        {selected && <div className="grid gap-5">
          <div className="rounded-xl border border-line bg-ink/[.02] p-4"><p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">{selected.body}</p></div>
          {selected.kind === "review" && <div className="flex items-center gap-2 text-warning"><Star className="fill-current" size={20} /><strong>{selected.rating}/5</strong><span className="text-sm text-ink-soft">{selected.tripInstance?.originName} → {selected.tripInstance?.destName}</span></div>}
          {selected.screenshotUrl && <a href={selected.screenshotUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-laterite hover:underline"><ImageIcon size={16} /> Ouvrir l’image jointe</a>}
          <Field label="Note interne"><Textarea rows={4} value={adminNote} onChange={(event) => setAdminNote(event.target.value)} placeholder="Visible uniquement dans l’administration" /></Field>
          <Field label="Statut"><Select value={selected.status} onValueChange={updateStatus}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(STATUS_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></Field>
          <Button onClick={() => updateStatus(selected.status)}>Enregistrer la note</Button>
        </div>}
      </Drawer>
    </AdminShell>
  );
}
