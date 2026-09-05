"use client";
import { db } from "@cp/ui";
import { fmtMoney } from "@cp/ui";

const tone: Record<string, string> = {
  paid: "bg-stock/12 text-stock", pending: "bg-gold/15 text-gold", failed: "bg-sale/10 text-sale", refunded: "bg-navy/5 text-navy/60", partially_refunded: "bg-navy/5 text-navy/60",
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
    <div className="reveal space-y-8">
      <h1 className="font-display text-[40px] font-semibold uppercase leading-none tracking-[-1.5px] text-navy">
        Historique des paiements
      </h1>
      {isLoading ? (
        <div className="h-32 animate-pulse bg-mist" />
      ) : rows.length === 0 ? (
        <div className="bg-mist px-[26px] py-[60px] text-center font-body text-[15px] font-light text-navy/60">
          Aucun paiement pour le moment.
        </div>
      ) : (
        <div className="overflow-x-auto border border-navy/10 bg-white">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="border-b border-navy/10">
                <th className="px-6 py-4 font-display text-[14px] font-semibold uppercase tracking-[0.5px] text-navy">Date</th>
                <th className="px-6 py-4 font-display text-[14px] font-semibold uppercase tracking-[0.5px] text-navy">Référence</th>
                <th className="px-6 py-4 font-display text-[14px] font-semibold uppercase tracking-[0.5px] text-navy">Méthode</th>
                <th className="px-6 py-4 font-display text-[14px] font-semibold uppercase tracking-[0.5px] text-navy">Montant</th>
                <th className="px-6 py-4 font-display text-[14px] font-semibold uppercase tracking-[0.5px] text-navy">Statut</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-b border-navy/[.06] last:border-0">
                  <td className="px-6 py-4 font-body text-[15px] text-navy">{new Date(p.createdAt).toLocaleDateString("fr", { day: "numeric", month: "short", year: "numeric" })}</td>
                  <td className="px-6 py-4 font-mono text-[14px] text-gold-hover">{p.reference}</td>
                  <td className="px-6 py-4 font-body text-[15px] text-navy/60">{methodLabel[p.method] ?? p.method}</td>
                  <td className="px-6 py-4 font-display text-[18px] font-semibold tabular-nums text-navy">{fmtMoney(p.amount)}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1.5 font-display text-[13px] font-semibold uppercase tracking-[0.5px] ${tone[p.status] ?? "bg-navy/5 text-navy/60"}`}>
                      {label[p.status] ?? p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
