"use client";
import { useParams } from "next/navigation";
import { Printer, ArrowLeft } from "lucide-react";
import { useCoop, db, FullSpinner, fmtDate, fmtDateTime, fmtMoney } from "@cp/ui";

const STATUS_FR: Record<string, string> = {
  paid: "Payé", pending: "En attente", failed: "Échoué",
};

export default function FacturePage() {
  const { slug, coop, coopId } = useCoop();
  const params = useParams<{ id: string }>();
  const paymentId = params.id;

  const { data, isLoading } = db.useQuery({
    payments: {
      $: { where: { id: paymentId, "cooperative.id": coopId } },
      subscription: { plan: {} },
    },
  });
  const p = data?.payments?.[0];

  if (isLoading) return <FullSpinner />;
  if (!p) return <div className="grid min-h-dvh place-items-center text-slate-500">Facture introuvable.</div>;

  const plan = (p as any).subscription?.plan;
  const planName = plan?.name ?? (p.meta as any)?.planId ?? "Abonnement";
  const ref = (p.meta as any)?.merchantRef || p.providerRef || paymentId;
  const paidDate = p.paidAt ?? p.createdAt;

  return (
    <div className="min-h-dvh bg-slate-200 py-8 print:bg-white print:py-0">
      {/* toolbar (screen only) */}
      <div className="no-print mx-auto mb-5 flex max-w-[210mm] items-center justify-between gap-3 px-4">
        <a href={`/${slug}/abonnement`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 hover:text-slate-900">
          <ArrowLeft size={16} /> Retour à l'abonnement
        </a>
        <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-md bg-[#0f2d5c] px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
          <Printer size={16} /> Imprimer / PDF
        </button>
      </div>

      {/* A4 sheet */}
      <div className="mx-auto max-w-[210mm] bg-white p-[16mm] text-slate-800 shadow-sm print:shadow-none">
        <div className="flex items-start justify-between border-b border-slate-200 pb-6">
          <div>
            <p className="text-lg font-bold text-[#0f2d5c]">Cooperative Plus</p>
            <p className="mt-1 text-xs text-slate-500">Plateforme de gestion coopérative</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold tracking-tight">FACTURE</p>
            <p className="mt-1 text-xs text-slate-500">N° {ref}</p>
            <p className="text-xs text-slate-500">{fmtDate(p.createdAt)}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-6 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Facturé à</p>
            <p className="mt-1 font-semibold">{coop.displayName}</p>
            {coop.address ? <p className="text-slate-600">{coop.address}</p> : null}
            {coop.phone ? <p className="text-slate-600">{coop.phone}</p> : null}
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Statut</p>
            <p className="mt-1 font-semibold">{STATUS_FR[p.status] ?? p.status}</p>
            {p.status === "paid" ? <p className="text-slate-600">le {fmtDateTime(paidDate)}</p> : null}
          </div>
        </div>

        <table className="mt-8 w-full text-sm">
          <thead>
            <tr className="border-b border-slate-300 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="pb-2 font-semibold">Description</th>
              <th className="pb-2 text-right font-semibold">Montant</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-100">
              <td className="py-3">Abonnement — {planName}</td>
              <td className="py-3 text-right font-mono">{fmtMoney(p.amount)}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td className="pt-4 text-right font-semibold">Total</td>
              <td className="pt-4 text-right font-mono text-lg font-bold">{fmtMoney(p.amount)}</td>
            </tr>
          </tfoot>
        </table>

        <div className="mt-10 border-t border-slate-200 pt-4 text-xs text-slate-500">
          <p>Méthode : {p.provider === "papi" ? "Mobile Money (PAPI)" : p.method}</p>
          <p className="mt-1">Merci de votre confiance.</p>
        </div>
      </div>

      <style>{`@media print {
        @page { size: A4; margin: 0; }
        body { background: #fff; }
        .no-print { display: none !important; }
      }`}</style>
    </div>
  );
}
