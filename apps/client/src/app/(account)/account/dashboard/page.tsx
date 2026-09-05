"use client";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { db } from "@cp/ui";
import { fmtMoney } from "@cp/ui";

function StatCard({ label, value, accent }: { label: string; value: string; accent?: "gold" | "stock" }) {
  const valueColor = accent === "gold" ? "text-gold" : accent === "stock" ? "text-stock" : "text-navy";
  return (
    <div className="border border-navy/10 bg-white p-5 transition-colors hover:border-navy/20">
      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-navy/60">{label}</p>
      <p className={`mt-3 font-display text-[2rem] font-extrabold leading-none tabular-nums ${valueColor}`}>{value}</p>
    </div>
  );
}

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
    <div className="reveal space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Réservations" value={String(bookings.length)} />
        <StatCard label="À venir" value={String(upcoming.length)} accent="stock" />
        <StatCard label="Total dépensé" value={fmtMoney(spent)} accent="gold" />
      </div>

      {next?.tripInstance ? (
        <div className="flex flex-col items-start justify-between gap-4 bg-navy p-6 text-white sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-xl font-bold uppercase">Prochain départ</h2>
            <p className="mt-1 text-white/70">
              {next.tripInstance.originName} → {next.tripInstance.destName} · {new Date(next.tripInstance.departureAt).toLocaleString("fr", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })} · sièges {(next.tickets ?? []).map((t) => t.seatLabel).sort().join(", ")}
            </p>
          </div>
          <Link href={`/bookings/${next.reference}`} className="inline-flex shrink-0 items-center justify-center gap-2 bg-gold px-5 h-11 font-display uppercase tracking-wide text-navy transition-colors hover:bg-white hover:text-navy">
            Voir le billet <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <div className="bg-navy p-6 text-white">
          <h2 className="font-display text-xl font-bold uppercase">Aucun trajet à venir</h2>
          <p className="mt-1 text-white/70">Réservez votre prochain voyage.</p>
        </div>
      )}

      <Link href="/search">
        <div className="flex items-center gap-4 border border-navy/10 bg-white p-5 transition-colors hover:bg-navy/[.02]">
          <div className="grid h-11 w-11 place-items-center rounded-full bg-gold/12 text-gold"><Search size={20} /></div>
          <div className="flex-1">
            <p className="font-display font-bold uppercase">Réserver un nouveau trajet</p>
            <p className="text-sm text-navy/60">Recherchez parmi 47 coopératives</p>
          </div>
          <ArrowRight size={18} className="text-navy/60" />
        </div>
      </Link>
    </div>
  );
}
