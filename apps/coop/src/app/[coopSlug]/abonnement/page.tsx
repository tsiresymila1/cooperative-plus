"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, CreditCard, Clock, FileText } from "lucide-react";
import {
  DashboardShell,
  coopNav,
  useCoop,
  db,
  Button,
  Card,
  Badge,
  StatCard,
  ComponentCard,
  toast,
  fmtMoney,
  fmtDate,
  fmtDateTime,
  useCoopPlan,
  usePaymentPopup,
} from "@cp/ui";
import { api } from "@/lib/http/client";

const STATUS: Record<string, { label: string; tone: "success" | "warning" | "danger" | "neutral" }> = {
  trialing: { label: "Essai gratuit", tone: "neutral" },
  active: { label: "Actif", tone: "success" },
  past_due: { label: "Paiement en retard", tone: "warning" },
  suspended: { label: "Suspendu", tone: "danger" },
  cancelled: { label: "Résilié", tone: "danger" },
};

const PAY_STATUS: Record<string, { label: string; tone: "success" | "warning" | "danger" | "neutral" }> = {
  paid: { label: "Payé", tone: "success" },
  pending: { label: "En attente", tone: "warning" },
  failed: { label: "Échoué", tone: "danger" },
};

export default function AbonnementPage() {
  const { coopId, slug, coop, role, permissions, isPlatformAdmin } = useCoop();
  const { sub, plan, status, usage, max } = useCoopPlan(coopId);
  const { data } = db.useQuery({
    plans: { $: { where: { isActive: true } } },
    payments: { $: { where: { "cooperative.id": coopId }, order: { createdAt: "desc" } }, subscription: { plan: {} } },
  });
  const plans = [...(data?.plans ?? [])].sort((a: any, b: any) => a.priceAmount - b.priceAmount);
  // Only subscription payments (not rider bookings).
  const subPayments = (data?.payments ?? []).filter((p: any) => (p.meta as any)?.kind === "subscription");

  const st = STATUS[status ?? "trialing"] ?? STATUS.trialing;
  const periodEnd = (sub as any)?.currentPeriodEnd ?? (sub as any)?.trialEndsAt;

  const ROWS: { key: "vehicles" | "routes" | "assistants" | "trips"; label: string }[] = [
    { key: "vehicles", label: "Véhicules" },
    { key: "routes", label: "Itinéraires" },
    { key: "assistants", label: "Assistants" },
    { key: "trips", label: "Trajets ce mois" },
  ];

  const [paying, setPaying] = useState(false);
  const popup = usePaymentPopup((r) => {
    setPaying(false);
    if (r === "success") toast.success("Paiement confirmé — abonnement mis à jour.");
    else if (r === "failed") toast.error("Paiement échoué.");
  });

  // Redirect fallback (popup blocked): PAPI sends us back with ?payment=...
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("payment");
    if (p === "success") toast.success("Paiement confirmé — abonnement mis à jour.");
    else if (p === "failed") toast.error("Paiement échoué.");
    if (p) window.history.replaceState(null, "", window.location.pathname);
  }, []);

  // Pay for / upgrade to a plan. Free plans (Essai) have no pay button.
  async function pay(planId?: string) {
    const targetId = planId ?? plan?.id;
    if (!targetId) return;
    setPaying(true);
    try {
      const res = await api.subscription.initiate.$post({ json: { coopId, planId: targetId } });
      const data = await res.json();
      if (!res.ok || !("url" in data)) throw new Error((data as any)?.error ?? "Erreur");
      popup.open(data.url);
    } catch (e) {
      setPaying(false);
      toast.error(e instanceof Error ? e.message : "Échec du paiement.");
    }
  }

  return (
    <DashboardShell
      nav={coopNav(slug, "abonnement", { role, permissions, isPlatformAdmin })}
      title="Abonnement"
      tenant={coop.displayName}
      logoUrl={coop.logoUrl}
      breadcrumb={<><span>{coop.displayName}</span><span className="text-ink">Abonnement</span></>}
    >
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Current plan + status */}
        <ComponentCard
          title="Plan actuel"
          action={<Badge tone={st.tone}>{st.label}</Badge>}
        >
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-display text-2xl font-bold text-ink">{plan?.name ?? "—"}</p>
              <p className="mt-1 text-sm text-ink-soft">
                {plan ? (plan.priceAmount > 0 ? `${fmtMoney(plan.priceAmount)} / mois` : "Gratuit") : "Aucun abonnement"}
              </p>
              {periodEnd && (
                <p className="mt-2 flex items-center gap-1.5 text-sm text-ink-soft">
                  <Clock size={14} />
                  {status === "trialing" ? "Essai jusqu'au" : "Échéance"} {fmtDate(periodEnd)}
                </p>
              )}
            </div>
            {plan?.priceAmount > 0 && (
              <Button size="sm" onClick={() => pay()} disabled={paying}>
                <CreditCard size={16} /> {paying ? "…" : "Payer / Renouveler"}
              </Button>
            )}
          </div>
        </ComponentCard>

        {/* Usage vs limits — StatCard metric grid */}
        <div>
          <h3 className="mb-4 text-base font-medium text-ink">Utilisation</h3>
          <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
            {ROWS.map((r) => {
              const used = usage[r.key];
              const cap = max[r.key];
              const full = typeof cap === "number" && cap > 0 && used >= cap;
              return (
                <StatCard
                  key={r.key}
                  label={r.label}
                  value={cap && cap > 0 ? `${used} / ${cap}` : String(used)}
                  tone={full ? "laterite" : "ink"}
                  hint={full ? "Limite atteinte" : cap && cap > 0 ? "disponible" : undefined}
                  trend={full ? "down" : undefined}
                />
              );
            })}
          </div>
        </div>

        {/* Plan comparison */}
        <ComponentCard title="Plans" desc="Changez de plan selon vos besoins.">
          <div className="grid gap-4 sm:grid-cols-3">
            {plans.map((p: any) => {
              const current = p.id === plan?.id;
              return (
                <Card key={p.id} className={`p-5 ${current ? "border-laterite ring-1 ring-laterite/40" : ""}`}>
                  <div className="flex items-center justify-between">
                    <p className="font-display text-lg font-bold text-ink">{p.name}</p>
                    {current && <Badge tone="success">Actuel</Badge>}
                  </div>
                  <p className="mt-1 font-mono text-xl font-bold text-ink">{p.priceAmount > 0 ? fmtMoney(p.priceAmount) : "Gratuit"}<span className="text-xs font-normal text-ink-soft">{p.priceAmount > 0 ? " /mois" : ""}</span></p>
                  <ul className="mt-4 space-y-1.5 text-sm text-ink-soft">
                    <li className="flex items-center gap-2"><Check size={14} className="text-baobab" /> {p.maxVehicles} véhicules</li>
                    <li className="flex items-center gap-2"><Check size={14} className="text-baobab" /> {p.maxRoutes} itinéraires</li>
                    <li className="flex items-center gap-2"><Check size={14} className="text-baobab" /> {p.maxAssistants} assistants</li>
                    <li className="flex items-center gap-2"><Check size={14} className="text-baobab" /> {p.maxTripsMonth} trajets / mois</li>
                  </ul>
                  {!current && p.priceAmount > 0 && (
                    <Button size="sm" variant="outline" className="mt-4 w-full" onClick={() => pay(p.id)} disabled={paying}>Passer à {p.name}</Button>
                  )}
                </Card>
              );
            })}
          </div>
        </ComponentCard>

        {/* Payment history */}
        <ComponentCard
          title="Historique des paiements"
          desc="Vos paiements d'abonnement et leurs factures."
          bodyClassName={subPayments.length ? "p-0" : undefined}
        >
          {subPayments.length === 0 ? (
            <p className="text-sm text-ink-soft">Aucun paiement pour le moment.</p>
          ) : (
            <div className="divide-y divide-line">
              {subPayments.map((p: any) => {
                const s = PAY_STATUS[p.status] ?? { label: p.status, tone: "neutral" as const };
                const planName = p.subscription?.plan?.name ?? "Abonnement";
                return (
                  <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink">{planName} · {fmtMoney(p.amount)}</p>
                      <p className="mt-0.5 text-xs text-ink-soft">{fmtDateTime(p.paidAt ?? p.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={s.tone as any}>{s.label}</Badge>
                      {p.status === "paid" && (
                        <Link href={`/${slug}/abonnement/facture/${p.id}`} className="inline-flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1.5 text-xs font-medium text-ink hover:bg-ink/5">
                          <FileText size={13} /> Facture
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ComponentCard>
      </div>
    </DashboardShell>
  );
}
