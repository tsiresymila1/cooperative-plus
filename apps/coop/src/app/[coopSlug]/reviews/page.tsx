"use client";

import { useMemo } from "react";
import { ChevronRight, Star } from "lucide-react";
import { Badge, ComponentCard, DashboardShell, DataTable, StatCard, coopNav, db, fmtDateTime, useCoop, type Column } from "@cp/ui";

type Review = {
  id: string;
  name: string;
  rating: number;
  comment: string;
  createdAt: number | string;
  status: string;
  screenshotUrl?: string;
  booking?: { reference?: string };
  tripInstance?: { originName?: string; destName?: string };
};

export default function CoopReviewsPage() {
  const { coopId, slug, coop, role, permissions, isPlatformAdmin } = useCoop();
  const { data, isLoading } = db.useQuery({
    tripReviews: { $: { where: { "cooperative.id": coopId }, order: { createdAt: "desc" } }, booking: {}, tripInstance: {} },
  });
  const reviews = (data?.tripReviews ?? []) as Review[];
  const average = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;
  const columns = useMemo<Column<Review>[]>(() => [
    { key: "author", header: "Voyageur", render: (review) => <div><p className="font-medium text-ink">{review.name}</p><p className="font-mono text-xs text-ink-soft">{review.booking?.reference ?? "—"}</p></div> },
    { key: "trip", header: "Trajet", render: (review) => <span className="text-sm">{review.tripInstance?.originName ?? "—"} → {review.tripInstance?.destName ?? "—"}</span> },
    { key: "rating", header: "Note", render: (review) => <span className="inline-flex items-center gap-1 font-semibold text-warning"><Star size={14} className="fill-current" />{review.rating}/5</span> },
    { key: "comment", header: "Commentaire", render: (review) => <p className="max-w-md truncate text-sm text-ink-soft" title={review.comment}>{review.comment}</p> },
    { key: "date", header: "Reçu", render: (review) => <span className="text-xs text-ink-soft">{fmtDateTime(review.createdAt)}</span> },
    { key: "status", header: "Statut", render: (review) => <Badge tone={review.status === "resolved" ? "success" : "neutral"}>{review.status === "new" ? "Nouveau" : review.status === "in_progress" ? "En cours" : review.status === "resolved" ? "Résolu" : "Fermé"}</Badge> },
  ], []);

  return (
    <DashboardShell nav={coopNav(slug, "reviews", { role, permissions, isPlatformAdmin })} title="Avis voyageurs" subtitle="Avis vérifiés liés aux réservations de votre coopérative." tenant={coop.displayName} logoUrl={coop.logoUrl} breadcrumb={<><span>{coop.displayName}</span><ChevronRight size={12} /><span className="text-ink">Avis voyageurs</span></>}>
      <div className="mb-5 grid gap-4 sm:grid-cols-2">
        <StatCard label="Avis reçus" value={String(reviews.length)} icon={<Star size={20} />} />
        <StatCard label="Note moyenne" value={reviews.length ? `${average.toFixed(1)}/5` : "—"} tone="laterite" icon={<Star size={20} />} />
      </div>
      <ComponentCard title="Tous les avis" desc="Les coordonnées privées et notes internes de la plateforme ne sont pas affichées.">
        <DataTable rows={reviews} columns={columns} loading={isLoading} empty="Aucun avis voyageur pour le moment." />
      </ComponentCard>
    </DashboardShell>
  );
}
