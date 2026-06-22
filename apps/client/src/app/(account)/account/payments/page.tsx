"use client";
import { Badge, Card } from "@cp/ui";
import { db } from "@cp/ui";
import { fmtMoney } from "@cp/ui";

const tone: Record<string, "success" | "warning" | "neutral" | "danger"> = {
  paid: "success", pending: "warning", failed: "danger", refunded: "neutral", partially_refunded: "neutral",
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
    <div className="space-y-3">
      <h1 className="font-display text-2xl font-bold">Historique des paiements</h1>
      {isLoading ? (
        <div className="h-32 animate-pulse rounded-2xl bg-ink/5" />
      ) : rows.length === 0 ? (
        <Card className="p-12 text-center text-ink-soft">Aucun paiement pour le moment.</Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-widest text-ink-soft/60">
              <tr className="border-b border-ink/8">
                <th className="px-5 py-3 font-medium">Date</th><th className="px-5 py-3 font-medium">Référence</th>
                <th className="px-5 py-3 font-medium">Méthode</th><th className="px-5 py-3 font-medium">Montant</th>
                <th className="px-5 py-3 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-b border-ink/5 last:border-0">
                  <td className="px-5 py-4">{new Date(p.createdAt).toLocaleDateString("fr", { day: "numeric", month: "short", year: "numeric" })}</td>
                  <td className="px-5 py-4 font-mono text-orange-deep">{p.reference}</td>
                  <td className="px-5 py-4 text-ink-soft">{methodLabel[p.method] ?? p.method}</td>
                  <td className="px-5 py-4 font-mono tabular-nums">{fmtMoney(p.amount)}</td>
                  <td className="px-5 py-4"><Badge tone={tone[p.status] ?? "neutral"}>{label[p.status] ?? p.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
