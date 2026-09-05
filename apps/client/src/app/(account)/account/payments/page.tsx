"use client";
import { db } from "@cp/ui";
import { fmtMoney } from "@cp/ui";

const tone: Record<string, string> = {
  paid: "bg-stock/10 text-stock", pending: "bg-gold/15 text-gold-hover", failed: "bg-sale/10 text-sale", refunded: "bg-navy/5 text-navy/60", partially_refunded: "bg-navy/5 text-navy/60",
};
const label: Record<string, string> = {
  paid: "Payé", pending: "En attente", failed: "Échoué", refunded: "Remboursé", partially_refunded: "Remb. partiel",
};
const methodLabel: Record<string, string> = { mobile_money: "Mobile Money", card: "Carte", cash: "Espèces" };

export default function Payments() {
  const { user } = db.useAuth();
  const { data, isLoading } = db.useQuery(
    user ? { bookings: { $: { where: { "customer.id": user.id } }, payments: {} } } : null,
  );
  const rows = (data?.bookings ?? []).flatMap((b) => (b.payments ?? []).map((p) => ({ ...p, reference: b.reference })))
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  return (
    <div className="reveal space-y-3">
      <h1 className="font-display text-2xl font-bold uppercase">Historique des paiements</h1>
      {isLoading ? (
        <div className="h-32 animate-pulse bg-navy/5" />
      ) : rows.length === 0 ? (
        <div className="border border-navy/10 bg-white p-12 text-center text-navy/60">Aucun paiement pour le moment.</div>
      ) : (
        <div className="overflow-hidden border border-navy/10 bg-white">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-widest text-navy/60">
              <tr className="border-b border-navy/10">
                <th className="px-5 py-3 font-medium">Date</th><th className="px-5 py-3 font-medium">Référence</th>
                <th className="px-5 py-3 font-medium">Méthode</th><th className="px-5 py-3 font-medium">Montant</th>
                <th className="px-5 py-3 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-b border-navy/[.06] last:border-0">
                  <td className="px-5 py-4">{new Date(p.createdAt).toLocaleDateString("fr", { day: "numeric", month: "short", year: "numeric" })}</td>
                  <td className="px-5 py-4 font-mono text-gold-hover">{p.reference}</td>
                  <td className="px-5 py-4 text-navy/60">{methodLabel[p.method] ?? p.method}</td>
                  <td className="px-5 py-4 font-mono tabular-nums">{fmtMoney(p.amount)}</td>
                  <td className="px-5 py-4"><span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold ${tone[p.status] ?? "bg-navy/5 text-navy/60"}`}>{label[p.status] ?? p.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
