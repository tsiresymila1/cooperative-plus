"use client";
import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";
import { Spinner, db, fmtMoney, fmtTime, notDeleted } from "@cp/ui";
import PageBanner from "@/components/site/PageBanner";
import BookingForm from "@/components/sections/BookingForm";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function toDate(s: string | null) {
  if (!s) return new Date();
  const d = new Date(s + "T00:00:00");
  return isNaN(+d) ? new Date() : d;
}
// local Y-M-D (NOT toISOString — that shifts to UTC and breaks the day in +03:00)
const dateKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

// "3h30" / "45 min" for the duration cell
function fmtDuration(min?: number | null) {
  if (!min || min <= 0) return null;
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (!h) return `${m} min`;
  return m ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}

function SearchInner() {
  const sp = useSearchParams();
  // URL params drive the live query (BookingForm navigates here with these).
  const from = sp.get("from") || "Antananarivo";
  const to = sp.get("to") || "Mahajanga";
  const date = toDate(sp.get("date"));
  const pax = Number(sp.get("pax")) || 1;
  const [sort, setSort] = useState<"depart" | "price" | "seats">("depart");

  const dk = dateKey(date);
  // live results react to from/to/date
  const { data, isLoading } = db.useQuery({
    tripInstances: {
      $: { where: { originName: from, destName: to, departDate: dk, status: "scheduled" }, order: { departureAt: "asc" } },
      route: {}, cooperative: {}, tickets: { booking: {} }, holds: {}, tag: {},
    },
  });

  const now = Date.now();
  const results = useMemo(() => {
    const rows = (data?.tripInstances ?? [])
      .filter((t) => (t.cooperative as any)?.subscriptionStatus !== "suspended")
      // Hide trips whose departure time has already passed (same-day past hours).
      .filter((t) => +new Date(t.departureAt) > now)
      .map((t) => {
        const held = (t.holds ?? []).filter((h) => +new Date(h.expiresAt) > now).length;
        const dead = ["cancelled", "expired", "refunded"];
        const ticketed = (t.tickets ?? []).filter((tk: any) => !dead.includes(tk.booking?.status)).length;
        const taken = ticketed + held;
        return { ...t, avail: Math.max(0, t.seatsTotal - taken) };
      }).filter((t) => t.avail >= pax);
    return [...rows].sort((a, b) =>
      sort === "price" ? a.price - b.price
        : sort === "seats" ? b.avail - a.avail
          : +new Date(a.departureAt) - +new Date(b.departureAt));
  }, [data, pax, sort, now]);

  return (
    <main>
      <PageBanner title="Nos trajets" />

      {/* Filter — template booking form, wired to /search */}
      <section className="pt-[60px]">
        <div className="mx-auto max-w-shell px-[15px]">
          <BookingForm className="bg-navy/10" />
        </div>
      </section>

      {/* Results — template Schedule row markup, fed with our real trips */}
      <section className="py-[60px] lg:py-[79px]">
        <div className="mx-auto max-w-shell px-[15px]">
          <div className="mb-[40px] flex flex-wrap items-center justify-between gap-4">
            <p className="font-display text-[24px] font-semibold uppercase leading-none text-navy">
              {isLoading ? "Recherche…" : `${results.length} trajet${results.length > 1 ? "s" : ""}`}
              <span className="ml-3 font-body text-[14px] font-light normal-case text-navy/60">{from} → {to}</span>
            </p>
            <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
              <SelectTrigger className="h-10 w-48 rounded-none border-navy/10 font-body text-[14px] text-navy"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="depart">Heure de départ</SelectItem>
                <SelectItem value="price">Prix croissant</SelectItem>
                <SelectItem value="seats">Places disponibles</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <ul className="space-y-[14px]">
              {[0, 1, 2, 3].map((i) => <li key={i} className="h-[110px] animate-pulse bg-mist" />)}
            </ul>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center gap-3 bg-mist px-6 py-[80px] text-center">
              <Search className="size-8 text-navy/25" />
              <p className="font-display text-[24px] font-semibold uppercase leading-none text-navy">Aucun trajet</p>
              <p className="font-body text-[14px] font-light text-navy/60">Essayez une autre date ou destination.</p>
            </div>
          ) : (
            <ul className="space-y-[14px]">
              {results.map((t) => {
                const duration = fmtDuration((t as any).route?.durationMin) ?? t.coopName;
                return (
                  <li
                    key={t.id}
                    className="grid grid-cols-2 items-center gap-x-4 gap-y-4 bg-mist px-[26px] py-[26px] lg:grid-cols-[1fr_1fr_1fr_140px_120px_170px] lg:gap-6"
                  >
                    <div>
                      <span className="block font-display text-[24px] font-semibold uppercase leading-none text-navy">
                        {t.originName}
                      </span>
                      <span className="mt-1 block font-body text-[14px] font-light text-navy/60">
                        {fmtTime(t.departureAt)}
                      </span>
                    </div>

                    <div className="text-center">
                      <span className="font-body text-[14px] font-light text-navy/60">
                        {duration}
                      </span>
                    </div>

                    <div>
                      <span className="block font-display text-[24px] font-semibold uppercase leading-none text-navy">
                        {t.destName}
                      </span>
                      <span className="mt-1 block font-body text-[14px] font-light text-navy/60">
                        {t.coopName}
                      </span>
                    </div>

                    <div>
                      <span className="block font-display text-[24px] font-semibold leading-none text-navy">
                        {fmtMoney(t.price)}
                      </span>
                      <span className="mt-1 block font-body text-[12px] font-light text-navy/60">
                        par adulte
                      </span>
                    </div>

                    <div>
                      <span className="block font-display text-[24px] font-semibold leading-none text-stock">
                        {t.avail}
                      </span>
                      <span className="mt-1 block font-body text-[12px] font-light text-navy/60">
                        places restantes
                      </span>
                    </div>

                    <Link
                      href={`/trips/${t.id}`}
                      className="inline-flex items-center gap-2 font-display text-[16px] font-semibold uppercase text-navy transition-colors duration-500 hover:text-gold"
                    >
                      Réserver
                      <ArrowRight className="size-4" strokeWidth={2} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="grid min-h-[60vh] place-items-center px-5 py-20 pt-[100px]"><Spinner size={28} /></div>}>
      <SearchInner />
    </Suspense>
  );
}
