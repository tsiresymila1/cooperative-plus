"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { db, fmtMoney, fmtTime } from "@cp/ui";
import SectionHeading from "@/components/ui/SectionHeading";

/* Band y4938..6212 at 1440; table block y5077 h1005.
   Day strip is a real tab control: switching a day filters live trips for that
   calendar date. Rows are real tripInstances (same markup as /search). */

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const MONTHS = ["JANV", "FÉVR", "MARS", "AVR", "MAI", "JUIN", "JUIL", "AOÛT", "SEPT", "OCT", "NOV", "DÉC"];
// local Y-M-D (not toISOString — that shifts to UTC and breaks the day in +03:00)
const dateKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

type WeekDay = { label: string; sub: string; key: string; today: boolean };

function weekDays(now = new Date()): WeekDay[] {
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  return DAYS.map((label, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const today = d.toDateString() === now.toDateString();
    return {
      label: today ? "Aujourd'hui" : label,
      sub: today ? "" : `${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()]}`,
      key: dateKey(d),
      today,
    };
  });
}

function fmtDuration(min?: number | null) {
  if (!min || min <= 0) return null;
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (!h) return `${m} min`;
  return m ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}

export default function Schedule({
  padding = "py-[100px] lg:py-[79px]",
}: {
  padding?: string;
} = {}) {
  const days = useMemo(() => weekDays(), []);
  const [active, setActive] = useState(() => {
    const i = days.findIndex((d) => d.today);
    return i >= 0 ? i : 0;
  });

  // Whole visible week in one query; grouped/filtered client-side by tab.
  const { data, isLoading } = db.useQuery({
    tripInstances: {
      $: { where: { departDate: { in: days.map((d) => d.key) }, status: "scheduled" }, order: { departureAt: "asc" } },
      route: {}, cooperative: {}, tickets: { booking: {} }, holds: {},
    },
  });

  const now = Date.now();
  const rows = useMemo(() => {
    const activeKey = days[active]?.key;
    return (data?.tripInstances ?? [])
      .filter((t) => t.departDate === activeKey)
      .filter((t) => (t.cooperative as any)?.subscriptionStatus !== "suspended")
      .filter((t) => +new Date(t.departureAt) > now)
      .map((t) => {
        const held = (t.holds ?? []).filter((h: any) => +new Date(h.expiresAt) > now).length;
        const dead = ["cancelled", "expired", "refunded"];
        const ticketed = (t.tickets ?? []).filter((tk: any) => !dead.includes(tk.booking?.status)).length;
        return { ...t, avail: Math.max(0, t.seatsTotal - ticketed - held) };
      })
      .filter((t) => t.avail > 0)
      .slice(0, 8);
  }, [data, active, days, now]);

  return (
    <section
      className={`bg-contain bg-center bg-no-repeat ${padding}`}
      style={{ backgroundImage: "url('/wp-content/uploads/2025/04/schedule-bg.png')" }}
    >
      <div className="mx-auto max-w-shell px-[15px]">
        <SectionHeading eyebrow="Heure de départ" title="Horaires récents" align="center" className="mb-[50px]" />

        {/* Day tab strip — navy bar, active tab gold */}
        <div className="mb-[40px] grid grid-cols-4 bg-navy md:grid-cols-7">
          {days.map((d, i) => (
            <button
              key={d.key}
              type="button"
              onClick={() => setActive(i)}
              aria-pressed={i === active}
              className={`flex h-[80px] flex-col items-center justify-center transition-colors duration-300 ${
                i === active ? "bg-gold text-navy" : "text-white hover:bg-white/10"
              }`}
            >
              <span className="font-display text-[16px] font-semibold uppercase leading-none">{d.label}</span>
              {d.sub ? (
                <span className="mt-2 font-body text-[12px] font-semibold uppercase tracking-[2px] opacity-60">{d.sub}</span>
              ) : null}
            </button>
          ))}
        </div>

        {isLoading ? (
          <ul className="space-y-[14px]">
            {[0, 1, 2, 3].map((i) => <li key={i} className="h-[110px] animate-pulse bg-mist" />)}
          </ul>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 bg-mist px-6 py-[80px] text-center">
            <Search className="size-8 text-navy/25" />
            <p className="font-display text-[24px] font-semibold uppercase leading-none text-navy">Aucun trajet ce jour</p>
            <p className="font-body text-[14px] font-light text-navy/60">Choisissez une autre date.</p>
          </div>
        ) : (
          <ul className="space-y-[14px]">
            {rows.map((t) => {
              const duration = fmtDuration((t as any).route?.durationMin) ?? t.coopName;
              return (
                <li
                  key={t.id}
                  className="grid grid-cols-2 items-center gap-x-4 gap-y-4 bg-mist px-[26px] py-[26px] lg:grid-cols-[1fr_1fr_1fr_140px_120px_170px] lg:gap-6"
                >
                  <div>
                    <span className="block font-display text-[24px] font-semibold uppercase leading-none text-navy">{t.originName}</span>
                    <span className="mt-1 block font-body text-[14px] font-light text-navy/60">{fmtTime(t.departureAt)}</span>
                  </div>

                  <div className="text-center">
                    <span className="font-body text-[14px] font-light text-navy/60">{duration}</span>
                  </div>

                  <div>
                    <span className="block font-display text-[24px] font-semibold uppercase leading-none text-navy">{t.destName}</span>
                    <span className="mt-1 block font-body text-[14px] font-light text-navy/60">{t.coopName}</span>
                  </div>

                  <div>
                    <span className="block font-display text-[24px] font-semibold leading-none text-navy">{fmtMoney(t.price)}</span>
                    <span className="mt-1 block font-body text-[12px] font-light text-navy/60">par adulte</span>
                  </div>

                  <div>
                    <span className="block font-display text-[24px] font-semibold leading-none text-stock">{t.avail}</span>
                    <span className="mt-1 block font-body text-[12px] font-light text-navy/60">places restantes</span>
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
  );
}
