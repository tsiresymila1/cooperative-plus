"use client";
import Link from "next/link";
import { ChevronRight, Ticket } from "lucide-react";
import { Badge, Button, Card } from "@cp/ui";
import { db } from "@cp/ui";
import { fmtMoney } from "@cp/ui";

const tone: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  confirmed: "success", pending: "warning", cancelled: "danger", expired: "neutral", completed: "neutral", no_show: "danger",
};
const label: Record<string, string> = {
  confirmed: "confirmé", pending: "en attente", cancelled: "annulé", expired: "expiré", completed: "terminé", no_show: "absent",
};

export default function Bookings() {
  const { user } = db.useAuth();
  const { data, isLoading } = db.useQuery(
    user ? { bookings: { $: { where: { "customer.id": user.id }, order: { createdAt: "desc" } }, tickets: {}, tripInstance: {} } } : null,
  );
  const bookings = data?.bookings ?? [];

  return (
    <div className="space-y-3">
      <h1 className="font-display text-2xl font-bold">Mes réservations</h1>
      {isLoading ? (
        [0, 1].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-ink/5" />)
      ) : bookings.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <Ticket className="text-ink-soft/40" />
          <p className="font-display text-lg font-bold">Aucune réservation</p>
          <Link href="/search"><Button size="sm">Réserver un trajet</Button></Link>
        </Card>
      ) : bookings.map((b) => (
        <Link key={b.id} href={`/bookings/${b.reference}`}>
          <Card className="flex items-center gap-4 p-5 transition-colors hover:bg-ink/[.02]">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-orange-deep">{b.reference}</span>
                <Badge tone={tone[b.status] ?? "neutral"}>{label[b.status] ?? b.status}</Badge>
              </div>
              <p className="mt-1 font-display text-lg font-bold">{b.tripInstance?.originName} → {b.tripInstance?.destName}</p>
              <p className="text-sm text-ink-soft">
                {b.tripInstance ? new Date(b.tripInstance.departureAt).toLocaleString("fr", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}
                {" · "}sièges {(b.tickets ?? []).map((t) => t.seatLabel).sort().join(", ")}
              </p>
            </div>
            <p className="font-mono text-lg font-bold">{fmtMoney(b.totalAmount)}</p>
            <ChevronRight size={18} className="text-ink-soft/50" />
          </Card>
        </Link>
      ))}
    </div>
  );
}
