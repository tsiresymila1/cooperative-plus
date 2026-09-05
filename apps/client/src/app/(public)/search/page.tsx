"use client";
import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { ArrowLeftRight, ArrowRight, Bus, CalendarDays, Clock, MapPin, Search, Users } from "lucide-react";
import { Spinner, CoopLogo, TagBadge, db, fmtMoney, notDeleted } from "@cp/ui";
import PageBanner from "@/components/site/PageBanner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";

function toDate(s: string | null) {
  if (!s) return new Date();
  const d = new Date(s + "T00:00:00");
  return isNaN(+d) ? new Date() : d;
}
// local Y-M-D (NOT toISOString — that shifts to UTC and breaks the day in +03:00)
const dateKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function SearchInner() {
  const sp = useSearchParams();
  const [from, setFrom] = useState(sp.get("from") || "Antananarivo");
  const [to, setTo] = useState(sp.get("to") || "Mahajanga");
  const [date, setDate] = useState<Date | undefined>(toDate(sp.get("date")));
  const [pax, setPax] = useState(Number(sp.get("pax")) || 1);
  const [sort, setSort] = useState<"depart" | "price" | "seats">("depart");

  // destination options (real, from DB)
  const { data: destData } = db.useQuery({ destinations: { $: { where: { isGlobal: true }, order: { name: "asc" } } } });
  // Dedupe by name — duplicate destination records would otherwise show twice
  // and both match the same Select value (concatenated label + double check).
  const cities = [...new Set((destData?.destinations ?? []).filter(notDeleted).map((d) => d.name))];

  const dk = date ? dateKey(date) : "";
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

  const swap = () => { setFrom(to); setTo(from); };

  return (
    <main>
      <PageBanner title="Nos trajets" />

      <section className="py-[60px] lg:py-[79px]">
        <div className="mx-auto max-w-shell px-[15px]">
          {/* Filter bar — Tourix booking-field look, controlled/live search */}
          <div className="relative grid grid-cols-1 gap-px bg-navy/10 md:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr]">
            <Field label="Départ :" icon={<MapPin className="size-[13px] text-gold" />}>
              <Select value={from} onValueChange={setFrom}>
                <SelectTrigger className="h-8 rounded-none border-0 bg-transparent p-0 font-body text-[18px] font-normal text-navy shadow-none focus:ring-0"><SelectValue /></SelectTrigger>
                <SelectContent>{cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </Field>

            <button
              type="button"
              aria-label="Inverser départ et arrivée"
              onClick={swap}
              className="absolute left-1/2 top-[52px] z-20 hidden size-[38px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-navy shadow-[0_2px_10px_rgba(20,49,76,0.15)] transition-colors duration-300 hover:text-gold md:flex lg:left-[25%]"
            >
              <ArrowLeftRight className="size-4" strokeWidth={2} />
            </button>

            <Field label="Arrivée :" icon={<MapPin className="size-[13px] text-gold" />}>
              <Select value={to} onValueChange={setTo}>
                <SelectTrigger className="h-8 rounded-none border-0 bg-transparent p-0 font-body text-[18px] font-normal text-navy shadow-none focus:ring-0"><SelectValue /></SelectTrigger>
                <SelectContent>{cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </Field>

            <Field label="Date :" icon={<CalendarDays className="size-[13px] text-gold" />}>
              <DatePicker value={date} onChange={setDate} className="h-8 rounded-none border-0 bg-transparent p-0 text-[18px] text-navy shadow-none focus:border-0 focus:ring-0" />
            </Field>

            <Field label="Voyageurs :" icon={<Users className="size-[13px] text-gold" />}>
              <input
                type="number"
                min={1}
                max={20}
                value={pax}
                onChange={(e) => setPax(Math.max(1, +e.target.value))}
                className="h-8 w-full bg-transparent font-body text-[18px] font-normal text-navy outline-none"
              />
            </Field>
          </div>

          {/* Results header */}
          <div className="mb-[24px] mt-[50px] flex flex-wrap items-center justify-between gap-4">
            <p className="font-display text-[20px] font-semibold uppercase leading-none tracking-[-0.5px] text-navy">
              {isLoading ? "Recherche…" : `${results.length} trajet${results.length > 1 ? "s" : ""}`}
              <span className="ml-3 font-body text-[13px] font-light normal-case tracking-normal text-navy/50">{from} → {to}</span>
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

          {/* Results */}
          {isLoading ? (
            <ul className="space-y-[14px]">
              {[0, 1, 2, 3].map((i) => <li key={i} className="h-[110px] animate-pulse bg-mist" />)}
            </ul>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center gap-3 border border-navy/10 bg-white px-6 py-[80px] text-center">
              <Search className="size-8 text-navy/25" />
              <p className="font-display text-[24px] font-semibold uppercase leading-none text-navy">Aucun trajet</p>
              <p className="font-body text-[14px] font-light text-navy/60">Essayez une autre date ou destination.</p>
            </div>
          ) : (
            <ul className="space-y-[14px]">
              {results.map((t, i) => (
                <motion.li
                  key={t.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="relative grid grid-cols-2 items-center gap-x-4 gap-y-5 border border-navy/10 bg-white px-[26px] py-[24px] lg:grid-cols-[1.1fr_1fr_1.2fr_130px_150px] lg:gap-6"
                >
                  {(t as any).tag && (
                    <div className="absolute -top-2 right-4 z-20">
                      <TagBadge name={(t as any).tag.name} color={(t as any).tag.color} className="shadow-md" />
                    </div>
                  )}

                  {/* Route: origin → destination */}
                  <div className="col-span-2 flex items-center gap-3 lg:col-span-1">
                    <div className="min-w-0">
                      <span className="block truncate font-display text-[24px] font-semibold uppercase leading-none text-navy">
                        {(t as any).originName ?? from}
                      </span>
                      <span className="mt-1.5 flex items-center gap-1 font-body text-[13px] font-light text-navy/60">
                        <Clock className="size-[13px]" />
                        {new Date(t.departureAt).toLocaleTimeString("fr", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <ArrowRight className="size-4 shrink-0 text-gold" strokeWidth={2} />
                    <div className="min-w-0">
                      <span className="block truncate font-display text-[24px] font-semibold uppercase leading-none text-navy">
                        {(t as any).destName ?? to}
                      </span>
                      <span className="mt-1.5 flex items-center gap-1 font-body text-[13px] font-light text-navy/60">
                        <CalendarDays className="size-[13px]" />
                        {new Date(t.departureAt).toLocaleDateString("fr")}
                      </span>
                    </div>
                  </div>

                  {/* Cooperative */}
                  <div className="flex items-center gap-3">
                    <CoopLogo url={t.cooperative?.logoUrl} name={t.coopName} size={40} />
                    <div className="min-w-0">
                      <p className="truncate font-display text-[16px] font-semibold uppercase leading-none text-navy">{t.coopName}</p>
                      <p className="mt-1 flex items-center gap-1.5 font-body text-[12px] font-light text-navy/60"><Bus className="size-3" /> {t.vehicleName}</p>
                    </div>
                  </div>

                  {/* Seats left */}
                  <div>
                    <span className="block font-display text-[24px] font-semibold leading-none text-stock">{t.avail}</span>
                    <span className="mt-1 block font-body text-[12px] font-light text-navy/60">
                      place{t.avail > 1 ? "s" : ""} libre{t.avail > 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Price + CTA */}
                  <div className="col-span-2 flex items-center justify-between gap-4 lg:col-span-1 lg:flex-col lg:items-end lg:justify-center">
                    <div className="lg:text-right">
                      <span className="block font-display text-[24px] font-semibold leading-none text-gold">{fmtMoney(t.price)}</span>
                      <span className="mt-1 block font-body text-[12px] font-light text-navy/60">par personne</span>
                    </div>
                    <Link
                      href={`/trips/${t.id}`}
                      className="inline-flex items-center gap-2 font-display text-[16px] font-semibold uppercase text-navy transition-colors duration-500 hover:text-gold"
                    >
                      Réserver
                      <ArrowRight className="size-4" strokeWidth={2} />
                    </Link>
                  </div>
                </motion.li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}

function Field({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="relative bg-white px-6 pb-[20px] pt-[24px]">
      <span className="flex items-center gap-1.5 font-body text-[14px] font-light text-black/40">
        {icon}{label}
      </span>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="grid min-h-[60vh] place-items-center px-5 py-20 pt-[100px]"><Spinner size={28} /></div>}>
      <SearchInner />
    </Suspense>
  );
}
