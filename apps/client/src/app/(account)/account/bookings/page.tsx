"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Search, Ticket, X } from "lucide-react";
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
  confirmed: "bg-stock/10 text-stock",
  paid: "bg-stock/10 text-stock",
  pending: "bg-gold/15 text-gold-hover",
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
    <div className=" space-y-3">
      <h1 className="font-display text-2xl font-bold uppercase">Mes réservations</h1>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex bg-navy/5 p-1">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => { setTab(t.key); setPage(0); }}
              className={t.key === tab
                ? "bg-white px-4 py-1.5 text-sm font-display uppercase tracking-wide text-navy shadow-sm"
                : "px-4 py-1.5 text-sm font-display uppercase tracking-wide text-navy/60 hover:text-navy"}>
              {t.label} <span className="ml-1 text-xs text-navy/40">{t.n}</span>
            </button>
          ))}
        </div>
        <div className="relative sm:w-64">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-navy/40" />
          <input value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} placeholder="Rechercher…"
            className="h-11 w-full border border-navy/12 bg-white pl-9 pr-3.5 text-[15px] text-navy outline-none transition-colors placeholder:text-navy/40 focus:border-gold" />
        </div>
      </div>

      {isLoading ? (
        [0, 1].map((i) => (
          <div key={i} className="h-24 animate-pulse bg-navy/5" />
        ))
      ) : bookings.length === 0 ? (
        <div className="flex flex-col items-center gap-3 border border-navy/10 bg-white p-12 text-center">
          <Ticket className="text-navy/40" />
          <p className="font-display text-lg font-bold uppercase">
            {all.length === 0 ? "Aucune réservation" : q ? "Aucun résultat" : tab === "expired" ? "Aucune réservation expirée" : "Aucune réservation active"}
          </p>
          {all.length === 0 && (
            <Link href="/search" className="inline-flex h-9 items-center justify-center gap-2 bg-gold px-3 text-sm font-display uppercase tracking-wide text-navy transition-colors hover:bg-navy hover:text-white">
              Réserver un trajet
            </Link>
          )}
        </div>
      ) : (
        <div className="gap-2 flex flex-col">
          {shown.map((b) => {
            const ti: any = b.tripInstance;
            const tg = Array.isArray(ti?.tag) ? ti.tag[0] : ti?.tag;
            return (
            <Link className="" key={b.id} href={`/bookings/${b.reference}`}>
              <div className="flex items-center gap-4 border border-navy/10 bg-white p-5 transition-colors hover:bg-navy/[.02]">
                <CoopLogo url={b.tripInstance?.cooperative?.logoUrl} name={b.tripInstance?.coopName} size={44} className="border border-navy/10" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-navy">
                      {b.tripInstance?.coopName ?? "Cooperative Plus"}
                    </span>
                    {tg && <TagBadge name={tg.name} color={tg.color} />}
                  </div>
                  <p className="mt-1 font-display text-lg font-bold">
                    {b.tripInstance?.originName} → {b.tripInstance?.destName}
                  </p>
                  <p className="truncate text-sm text-navy/60">
                    {b.tripInstance
                      ? new Date(b.tripInstance.departureAt).toLocaleString("fr", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
                      : ""}
                    {" · "}sièges{" "}
                    {(b.tickets ?? []).map((t) => t.seatLabel).sort().join(", ")}
                    {" · "}
                    <span className="font-mono text-gold-hover">{b.reference}</span>
                  </p>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold ${tone[b.status] ?? "bg-navy/5 text-navy/60"}`}>{label[b.status] ?? b.status}</span>
                  <div className="flex items-center gap-2">
                    {b.status === "pending" && (
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); cancelOwnBooking(b, confirm); }}
                        className="grid h-8 w-8 place-items-center rounded-full text-navy/40 transition-colors hover:bg-sale/10 hover:text-sale"
                        title="Annuler la réservation"
                      >
                        <X size={16} />
                      </button>
                    )}
                    <p className="font-mono text-lg font-bold">{fmtMoney(b.totalAmount)}</p>
                    <ChevronRight size={18} className="text-navy/40" />
                  </div>
                </div>
              </div>
            </Link>
            );
          })}

          {pageCount > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button disabled={safePage === 0} onClick={() => setPage(safePage - 1)}
                className="inline-flex h-9 items-center justify-center gap-2 border border-navy/20 px-3 text-sm font-display uppercase tracking-wide text-navy transition-colors hover:border-gold hover:text-gold disabled:opacity-50 disabled:hover:border-navy/20 disabled:hover:text-navy">
                <ChevronLeft size={16} /> Précédent
              </button>
              <span className="px-2 text-sm text-navy/60">Page {safePage + 1} / {pageCount}</span>
              <button disabled={safePage >= pageCount - 1} onClick={() => setPage(safePage + 1)}
                className="inline-flex h-9 items-center justify-center gap-2 border border-navy/20 px-3 text-sm font-display uppercase tracking-wide text-navy transition-colors hover:border-gold hover:text-gold disabled:opacity-50 disabled:hover:border-navy/20 disabled:hover:text-navy">
                Suivant <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
