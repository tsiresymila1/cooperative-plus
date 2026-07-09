"use client";
import { Activity, Plus, Pencil, Trash2 } from "lucide-react";
import {
  DashboardShell,
  coopNav,
  useCoop,
  db,
  Card,
  Badge,
  fmtDate,
  fmtDateTime,
} from "@cp/ui";

const ACTION: Record<string, { verb: string; icon: any; tone: "success" | "neutral" | "danger" }> = {
  create: { verb: "a créé", icon: Plus, tone: "success" },
  update: { verb: "a modifié", icon: Pencil, tone: "neutral" },
  delete: { verb: "a supprimé", icon: Trash2, tone: "danger" },
};

const ENTITY: Record<string, string> = {
  vehicle: "véhicule", route: "itinéraire", trip: "trajet", assistant: "assistant",
  destination: "destination", model: "modèle", driver: "chauffeur", tag: "tag",
  payment: "paiement", subscription: "abonnement", settings: "paramètres", refund: "remboursement",
};

export default function ActivitePage() {
  const { coopId, slug, coop, role, permissions, isPlatformAdmin } = useCoop();
  const { data, isLoading } = db.useQuery({
    auditLogs: {
      $: { where: { "cooperative.id": coopId }, order: { createdAt: "desc" }, limit: 300 },
      actor: {},
    },
  });
  const logs = data?.auditLogs ?? [];

  // Group by calendar day for readability.
  const groups: { day: string; items: any[] }[] = [];
  for (const l of logs) {
    const day = fmtDate(l.createdAt);
    const g = groups[groups.length - 1];
    if (g && g.day === day) g.items.push(l);
    else groups.push({ day, items: [l] });
  }

  return (
    <DashboardShell
      nav={coopNav(slug, "activite", { role, permissions, isPlatformAdmin })}
      title="Activité"
      tenant={coop.displayName}
      logoUrl={coop.logoUrl}
      breadcrumb={<><span>{coop.displayName}</span><span className="text-ink">Activité</span></>}
    >
      <div className="mx-auto max-w-3xl space-y-6">
        {isLoading ? null : logs.length === 0 ? (
          <Card className="p-10 text-center text-sm text-ink-soft">
            <Activity className="mx-auto mb-3 text-ink-soft/40" size={28} />
            Aucune activité enregistrée pour le moment.
          </Card>
        ) : (
          groups.map((g) => (
            <div key={g.day}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft/55">{g.day}</p>
              <Card className="divide-y divide-ink/8">
                {g.items.map((l: any) => {
                  const a = ACTION[l.action] ?? { verb: l.action, icon: Activity, tone: "neutral" as const };
                  const Icon = a.icon;
                  const who = l.actor?.name || l.actor?.email || "Utilisateur";
                  const what = ENTITY[l.entityType] ?? l.entityType;
                  const label = (l.after as any)?.label;
                  return (
                    <div key={l.id} className="flex items-start gap-3 p-3.5">
                      <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink/5 text-ink-soft">
                        <Icon size={15} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-ink">
                          <span className="font-semibold">{who}</span> {a.verb} {what}
                          {label ? <span className="font-medium"> « {label} »</span> : null}
                        </p>
                        <p className="mt-0.5 text-xs text-ink-soft">{fmtDateTime(l.createdAt)}</p>
                      </div>
                      <Badge tone={a.tone as any}>{what}</Badge>
                    </div>
                  );
                })}
              </Card>
            </div>
          ))
        )}
      </div>
    </DashboardShell>
  );
}
