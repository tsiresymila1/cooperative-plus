"use client";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { db } from "@cp/ui";
import { fmtMoney } from "@cp/ui";

function StatCard({ label, value, accent }: { label: string; value: string; accent?: "gold" | "stock" }) {
  const valueColor = accent === "gold" ? "text-gold" : accent === "stock" ? "text-stock" : "text-navy";
  return (
    <div className="border border-navy/10 bg-white px-[26px] py-7 transition-colors duration-300 hover:border-gold">
      <p className="font-body text-eyebrow font-semibold uppercase text-navy/60">{label}</p>
      <p className={`mt-4 font-display text-[48px] font-semibold uppercase leading-none tabular-nums ${valueColor}`}>{value}</p>
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
    <div className="reveal space-y-[14px]">
      <div className="grid gap-[14px] sm:grid-cols-3">
        <StatCard label="Réservations" value={String(bookings.length)} />
        <StatCard label="À venir" value={String(upcoming.length)} accent="stock" />
        <StatCard label="Total dépensé" value={fmtMoney(spent)} accent="gold" />
      </div>

      {next?.tripInstance ? (
        <div className="flex flex-col items-start justify-between gap-6 bg-navy px-[26px] py-7 lg:flex-row lg:items-center">
          <div>
            <h2 className="font-display text-[24px] font-semibold uppercase leading-none text-white">Prochain départ</h2>
            <p className="mt-3 font-body text-[15px] font-light text-white/70">
              {next.tripInstance.originName} → {next.tripInstance.destName} · {new Date(next.tripInstance.departureAt).toLocaleString("fr", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })} · sièges {(next.tickets ?? []).map((t) => t.seatLabel).sort().join(", ")}
            </p>
          </div>
          <Link
            href={`/bookings/${next.reference}`}
            className="inline-flex h-[53px] shrink-0 items-center justify-center gap-2 bg-gold px-6 font-display text-[16px] font-semibold uppercase tracking-[0.5px] text-navy transition-colors duration-[250ms] ease-out hover:bg-white hover:text-navy"
          >
            Voir le billet <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <div className="bg-navy px-[26px] py-7">
          <h2 className="font-display text-[24px] font-semibold uppercase leading-none text-white">Aucun trajet à venir</h2>
          <p className="mt-3 font-body text-[15px] font-light text-white/70">Réservez votre prochain voyage.</p>
        </div>
      )}

      <Link href="/search">
        <div className="flex items-center gap-5 border border-navy/10 bg-white px-[26px] py-7 transition-colors duration-300 hover:border-gold">
          <div className="grid h-12 w-12 place-items-center bg-gold/12 text-gold"><Search size={22} /></div>
          <div className="flex-1">
            <p className="font-display text-[20px] font-semibold uppercase leading-none text-navy">Réserver un nouveau trajet</p>
            <p className="mt-2 font-body text-[14px] font-light text-navy/60">Recherchez parmi 47 coopératives</p>
          </div>
          <ArrowRight size={20} className="text-navy/60" />
        </div>
      </Link>
    </div>
  );
}
