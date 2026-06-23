"use client";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { Button, Card, StatCard } from "@cp/ui";
import { db } from "@cp/ui";
import { fmtMoney } from "@cp/ui";

export default function AccountDashboard() {
  const { user } = db.useAuth();
  const { data } = db.useQuery(
    user ? { bookings: { $: { where: { "customer.id": user.id }, order: { createdAt: "desc" } }, tripInstance: {}, tickets: {} } } : null,
  );
  const bookings = data?.bookings ?? [];
  const now = Date.now();
  const upcoming = bookings.filter((b) => b.status !== "cancelled" && b.tripInstance && +new Date(b.tripInstance.departureAt) > now);
  const next = upcoming.sort((a, b) => +new Date(a.tripInstance!.departureAt) - +new Date(b.tripInstance!.departureAt))[0];
  const spent = bookings.filter((b) => b.status !== "cancelled").reduce((s, b) => s + b.totalAmount, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Réservations" value={String(bookings.length)} />
        <StatCard label="À venir" value={String(upcoming.length)} tone="baobab" />
        <StatCard label="Total dépensé" value={fmtMoney(spent)} tone="laterite" />
      </div>

      {next?.tripInstance ? (
        <Card className="flex flex-col items-start justify-between gap-4 bg-strong p-6 text-white sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-xl font-bold">Prochain départ</h2>
            <p className="mt-1 text-white/70">
              {next.tripInstance.originName} → {next.tripInstance.destName} · {new Date(next.tripInstance.departureAt).toLocaleString("fr", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })} · sièges {(next.tickets ?? []).map((t) => t.seatLabel).sort().join(", ")}
            </p>
          </div>
          <Link href={`/bookings/${next.reference}`}><Button variant="primary">Voir le billet <ArrowRight size={16} /></Button></Link>
        </Card>
      ) : (
        <Card className="bg-strong p-6 text-white">
          <h2 className="font-display text-xl font-bold">Aucun trajet à venir</h2>
          <p className="mt-1 text-white/70">Réservez votre prochain voyage.</p>
        </Card>
      )}

      <Link href="/search">
        <Card className="flex items-center gap-4 p-5 transition-colors hover:bg-ink/[.02]">
          <div className="grid h-11 w-11 place-items-center rounded-full bg-orange/12 text-orange"><Search size={20} /></div>
          <div className="flex-1">
            <p className="font-display font-bold">Réserver un nouveau trajet</p>
            <p className="text-sm text-ink-soft">Recherchez parmi 47 coopératives</p>
          </div>
          <ArrowRight size={18} className="text-ink-soft" />
        </Card>
      </Link>
    </div>
  );
}
