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
  FormSection,
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
        <Card className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft/55">Plan actuel</p>
              <p className="mt-1 font-display text-2xl font-bold">{plan?.name ?? "—"}</p>
              <p className="mt-1 text-sm text-ink-soft">
                {plan ? (plan.priceAmount > 0 ? `${fmtMoney(plan.priceAmount)} / mois` : "Gratuit") : "Aucun abonnement"}
              </p>
            </div>
            <div className="text-right">
              <Badge tone={st.tone}>{st.label}</Badge>
              {periodEnd && (
                <p className="mt-2 flex items-center justify-end gap-1.5 text-sm text-ink-soft">
                  <Clock size={14} />
                  {status === "trialing" ? "Essai jusqu'au" : "Échéance"} {fmtDate(periodEnd)}
                </p>
              )}
            </div>
          </div>
          {plan?.priceAmount > 0 && (
            <div className="mt-5 flex justify-end">
              <Button size="sm" onClick={() => pay()} disabled={paying}>
                <CreditCard size={16} /> {paying ? "…" : "Payer / Renouveler"}
              </Button>
            </div>
          )}
        </Card>

        {/* Usage vs limits */}
        <FormSection index="01" title="Utilisation" description="Consommation par rapport aux limites de votre plan.">
          <div className="grid gap-4">
            {ROWS.map((r) => {
              const used = usage[r.key];
              const cap = max[r.key];
              const pct = cap && cap > 0 ? Math.min(100, Math.round((used / cap) * 100)) : 0;
              const full = typeof cap === "number" && cap > 0 && used >= cap;
              return (
                <div key={r.key}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-ink">{r.label}</span>
                    <span className={full ? "font-semibold text-danger" : "text-ink-soft"}>
                      {used}{cap && cap > 0 ? ` / ${cap}` : ""}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-ink/8">
                    <div className={`h-full rounded-full ${full ? "bg-danger" : "bg-laterite"}`} style={{ width: `${cap && cap > 0 ? pct : 4}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </FormSection>

        {/* Plan comparison */}
        <FormSection index="02" title="Plans" description="Changez de plan selon vos besoins.">
          <div className="grid gap-4 sm:grid-cols-3">
            {plans.map((p: any) => {
              const current = p.id === plan?.id;
              return (
                <Card key={p.id} className={`p-5 ${current ? "border-laterite ring-1 ring-laterite/40" : ""}`}>
                  <div className="flex items-center justify-between">
                    <p className="font-display text-lg font-bold">{p.name}</p>
                    {current && <Badge tone="success">Actuel</Badge>}
                  </div>
                  <p className="mt-1 font-mono text-xl font-bold">{p.priceAmount > 0 ? fmtMoney(p.priceAmount) : "Gratuit"}<span className="text-xs font-normal text-ink-soft">{p.priceAmount > 0 ? " /mois" : ""}</span></p>
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
        </FormSection>

        {/* Payment history */}
        <FormSection index="03" title="Historique des paiements" description="Vos paiements d'abonnement et leurs factures.">
          {subPayments.length === 0 ? (
            <p className="text-sm text-ink-soft">Aucun paiement pour le moment.</p>
          ) : (
            <Card className="divide-y divide-ink/8">
              {subPayments.map((p: any) => {
                const s = PAY_STATUS[p.status] ?? { label: p.status, tone: "neutral" as const };
                const planName = p.subscription?.plan?.name ?? "Abonnement";
                return (
                  <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 p-3.5">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink">{planName} · {fmtMoney(p.amount)}</p>
                      <p className="mt-0.5 text-xs text-ink-soft">{fmtDateTime(p.paidAt ?? p.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={s.tone as any}>{s.label}</Badge>
                      {p.status === "paid" && (
                        <Link href={`/${slug}/abonnement/facture/${p.id}`} className="inline-flex items-center gap-1.5 rounded-md border border-ink/12 px-2.5 py-1.5 text-xs font-medium text-ink hover:bg-ink/5">
                          <FileText size={13} /> Facture
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </Card>
          )}
        </FormSection>
      </div>
    </DashboardShell>
  );
}
