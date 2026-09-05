"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Search, Ticket } from "lucide-react";
import { CoopLogo, TagBadge, useConfirm, toast } from "@cp/ui";
import { db } from "@cp/ui";
import { fmtMoney } from "@cp/ui";

// Cancellable only while not yet paid (cash bookings sit in "pending").
async function cancelOwnBooking(b: any, confirm: ReturnType<typeof useConfirm>) {
  if (b.status !== "pending") return;
  if (!(await confirm({ title: "Annuler la réservation ?", message: `${b.reference} · ${fmtMoney(b.totalAmount)}`, confirmLabel: "Annuler", tone: "danger" }))) return;
  try {
    await db.transact([
      db.tx.bookings[b.id].update({ status: "cancelled", cancelledAt: Date.now() }),
      ...(b.tickets ?? []).map((t: any) => db.tx.tickets[t.id].delete()),
    ]);
    toast.success("Réservation annulée");
  } catch (e: any) {
    toast.error(e?.message ?? "Échec de l'annulation.");
  }
}

const tone: Record<string, string> = {
  confirmed: "bg-stock/12 text-stock",
  paid: "bg-stock/12 text-stock",
  pending: "bg-gold/15 text-gold",
  cancelled: "bg-sale/10 text-sale",
  refunded: "bg-sale/10 text-sale",
  expired: "bg-navy/5 text-navy/60",
  completed: "bg-navy/5 text-navy/60",
  no_show: "bg-sale/10 text-sale",
};
const label: Record<string, string> = {
  confirmed: "confirmé",
  paid: "payé",
  pending: "en attente",
  cancelled: "annulé",
  refunded: "remboursé",
  expired: "expiré",
  completed: "terminé",
  no_show: "absent",
};
const PAGE_SIZE = 8;

export default function Bookings() {
  const { user } = db.useAuth();
  const confirm = useConfirm();
  const { data, isLoading } = db.useQuery(
    user
      ? {
          bookings: {
            $: {
              where: { "customer.id": user.id },
              order: { createdAt: "desc" },
            },
            tickets: {},
            tripInstance: { cooperative: {}, tag: {} },
          },
        }
      : null,
  );
  const all = data?.bookings ?? [];
  const [tab, setTab] = useState<"active" | "expired">("active");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);

  const today = new Date().toISOString().slice(0, 10);
  const isExpired = (b: any) => {
    if (["cancelled", "expired", "refunded", "no_show"].includes(b.status)) return true;
    const ti = b.tripInstance;
    if (!ti) return false;
    const dd = ti.departDate ?? (ti.departureAt ? new Date(ti.departureAt).toISOString().slice(0, 10) : null);
    return dd ? dd < today : false;
  };

  const bookings = useMemo(() => {
    const term = q.trim().toLowerCase();
    return all
      .filter((b: any) => (tab === "expired" ? isExpired(b) : !isExpired(b)))
      .filter((b: any) => {
        if (!term) return true;
        const ti = b.tripInstance;
        return [b.reference, ti?.coopName, ti?.originName, ti?.destName]
          .some((v: any) => String(v ?? "").toLowerCase().includes(term));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all, tab, q, today]);

  const counts = useMemo(() => {
    let active = 0, expired = 0;
    for (const b of all) (isExpired(b) ? expired++ : active++);
    return { active, expired };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all, today]);

  const pageCount = Math.max(1, Math.ceil(bookings.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const shown = bookings.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  const TABS = [
    { key: "active" as const, label: "Actives", n: counts.active },
    { key: "expired" as const, label: "Expirées", n: counts.expired },
  ];

  return (
    <div className="space-y-8">
      <h1 className="font-display text-[40px] font-semibold uppercase leading-none tracking-[-1.5px] text-navy">
        Mes réservations
      </h1>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Tab strip — template day-strip look: navy bar, active tab gold. */}
        <div className="inline-flex bg-navy">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => { setTab(t.key); setPage(0); }}
              aria-pressed={t.key === tab}
              className={`flex h-[53px] items-center gap-2 px-6 font-display text-[16px] font-semibold uppercase tracking-[0.5px] transition-colors duration-300 ${
                t.key === tab ? "bg-gold text-navy" : "text-white hover:bg-white/10"
              }`}
            >
              {t.label}
              <span className="font-body text-[12px] font-semibold opacity-60">{t.n}</span>
            </button>
          ))}
        </div>
        <div className="relative lg:w-[300px]">
          <Search size={17} className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-navy/40" />
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(0); }}
            placeholder="Rechercher…"
            className="h-[53px] w-full border border-navy/15 bg-white pl-12 pr-5 font-body text-navy outline-none transition-colors placeholder:text-navy/40 focus:border-gold"
          />
        </div>
      </div>

      {isLoading ? (
        <ul className="space-y-[14px]">
          {[0, 1].map((i) => (
            <li key={i} className="h-[92px] animate-pulse bg-mist" />
          ))}
        </ul>
      ) : bookings.length === 0 ? (
        <div className="flex flex-col items-center gap-4 bg-mist px-[26px] py-[60px] text-center">
          <Ticket className="text-navy/40" />
          <p className="font-display text-[24px] font-semibold uppercase text-navy">
            {all.length === 0 ? "Aucune réservation" : q ? "Aucun résultat" : tab === "expired" ? "Aucune réservation expirée" : "Aucune réservation active"}
          </p>
          {all.length === 0 && (
            <Link
              href="/search"
              className="inline-flex items-center gap-2 font-display text-[16px] font-semibold uppercase text-navy transition-colors duration-500 hover:text-gold"
            >
              Réserver un trajet
              <ArrowRight className="size-4" strokeWidth={2} />
            </Link>
          )}
        </div>
      ) : (
        <ul className="space-y-[14px]">
          {shown.map((b) => {
            const ti: any = b.tripInstance;
            const tg = Array.isArray(ti?.tag) ? ti.tag[0] : ti?.tag;
            const seats = (b.tickets ?? []).map((t: any) => t.seatLabel).sort().join(", ");
            return (
              <li
                key={b.id}
                className="grid grid-cols-2 items-center gap-x-4 gap-y-4 bg-mist px-[26px] py-[26px] lg:grid-cols-[1fr_1fr_1fr_140px_120px_170px] lg:gap-6"
              >
                {/* FROM — origin + departure date/time */}
                <div>
                  <span className="block font-display text-[24px] font-semibold uppercase leading-none text-navy">
                    {ti?.originName ?? "—"}
                  </span>
                  <span className="mt-1 block font-body text-[14px] font-light text-navy/60">
                    {ti ? new Date(ti.departureAt).toLocaleString("fr", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : b.reference}
                  </span>
                </div>

                {/* Middle — cooperative identity, centered & muted */}
                <div className="flex items-center justify-center gap-2 text-center">
                  <CoopLogo url={ti?.cooperative?.logoUrl} name={ti?.coopName} size={32} className="border border-navy/10" />
                  <span className="font-body text-[14px] font-light text-navy/60">
                    {ti?.coopName ?? "Cooperative Plus"}
                  </span>
                  {tg && <TagBadge name={tg.name} color={tg.color} />}
                </div>

                {/* TO — destination + seats */}
                <div>
                  <span className="block font-display text-[24px] font-semibold uppercase leading-none text-navy">
                    {ti?.destName ?? "—"}
                  </span>
                  <span className="mt-1 block font-body text-[14px] font-light text-navy/60">
                    {seats ? `sièges ${seats}` : b.reference}
                  </span>
                </div>

                {/* Price */}
                <div>
                  <span className="block font-display text-[24px] font-semibold leading-none text-navy">
                    {fmtMoney(b.totalAmount)}
                  </span>
                  <span className="mt-1 block font-body text-[12px] font-light text-navy/60">
                    total
                  </span>
                </div>

                {/* Status pill */}
                <div>
                  <span className={`inline-flex items-center px-3 py-1.5 font-display text-[13px] font-semibold uppercase tracking-[0.5px] ${tone[b.status] ?? "bg-navy/5 text-navy/60"}`}>
                    {label[b.status] ?? b.status}
                  </span>
                </div>

                {/* Action — Voir / Annuler */}
                <div className="flex flex-col items-start gap-1 lg:items-end">
                  <Link
                    href={`/bookings/${b.reference}`}
                    className="inline-flex items-center gap-2 font-display text-[16px] font-semibold uppercase text-navy transition-colors duration-500 hover:text-gold"
                  >
                    Voir
                    <ArrowRight className="size-4" strokeWidth={2} />
                  </Link>
                  {b.status === "pending" && (
                    <button
                      onClick={() => cancelOwnBooking(b, confirm)}
                      className="font-display text-[14px] font-semibold uppercase tracking-[0.5px] text-navy/40 transition-colors duration-300 hover:text-sale"
                    >
                      Annuler
                    </button>
                  )}
                </div>
              </li>
            );
          })}

          {pageCount > 1 && (
            <li className="flex items-center justify-center gap-6 pt-4">
              <button
                disabled={safePage === 0}
                onClick={() => setPage(safePage - 1)}
                className="inline-flex items-center gap-2 font-display text-[16px] font-semibold uppercase text-navy transition-colors duration-500 hover:text-gold disabled:opacity-40 disabled:hover:text-navy"
              >
                <ChevronLeft size={16} /> Précédent
              </button>
              <span className="font-body text-[14px] text-navy/60">Page {safePage + 1} / {pageCount}</span>
              <button
                disabled={safePage >= pageCount - 1}
                onClick={() => setPage(safePage + 1)}
                className="inline-flex items-center gap-2 font-display text-[16px] font-semibold uppercase text-navy transition-colors duration-500 hover:text-gold disabled:opacity-40 disabled:hover:text-navy"
              >
                Suivant <ChevronRight size={16} />
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
