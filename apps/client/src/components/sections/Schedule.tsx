"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import { scheduleDays, SCHEDULE_ROWS } from "./data";

/* Band y4938..6212 at 1440; table block y5077 h1005.
   Day strip is a tab control in the source (`lte-tab-day`, one marked TODAY).
   The demo serves the same rows for every day, so switching tabs re-renders the
   same list — no invented data. */

export default function Schedule({
  padding = "py-[100px] lg:py-[79px]",
}: {
  padding?: string;
} = {}) {
  /* Dates roll daily in the source, so they are computed, not hardcoded —
     otherwise this section drifts from the source by ~93px every day. */
  const days = scheduleDays();
  const [active, setActive] = useState(() => {
    const i = days.findIndex((d) => d.today);
    return i >= 0 ? i : 0;
  });

  return (
    /* Source carries schedule-bg.png over the whole band: contain, 50% 50%,
       no repeat. It was missing entirely from the rebuild. */
    <section
      className={`bg-contain bg-center bg-no-repeat ${padding}`}
      style={{
        backgroundImage: "url('/wp-content/uploads/2025/04/schedule-bg.png')",
      }}
    >
      <div className="mx-auto max-w-shell px-[15px]">
        <SectionHeading
          eyebrow="Heure de départ"
          title="Horaires récents"
          align="center"
          className="mb-[50px]"
        />

        {/* Measured: the strip is a navy bar of 121x80 tabs; the active one is
            gold with navy text, the rest transparent with white text. */}
        <div className="mb-[40px] grid grid-cols-4 bg-navy md:grid-cols-7">
          {days.map((d, i) => (
            <button
              key={d.day}
              type="button"
              onClick={() => setActive(i)}
              aria-pressed={i === active}
              className={`flex h-[80px] flex-col items-center justify-center transition-colors duration-300 ${
                i === active
                  ? "bg-gold text-navy"
                  : "text-white hover:bg-white/10"
              }`}
            >
              <span className="font-display text-[16px] font-semibold uppercase leading-none">
                {d.day}
              </span>
              {d.date ? (
                <span className="mt-2 font-body text-[12px] font-semibold uppercase tracking-[2px] opacity-60">
                  {d.date}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {/* Rows sit on #eff3f4 separated by white gaps. A 1px divider was used
            for a while to hit a 1274 band, but that target came from a stale
            scrape — the live source runs this section at 1367 with real 10px
            gaps between rows. */}
        <ul className="space-y-[14px]">
          {SCHEDULE_ROWS.map((r) => (
            /* Below lg the source keeps the row compact (2410px for tabs + 8
               rows at 390, ~275px each) rather than stacking all six fields. */
            <li
              key={`${r.from}-${r.to}-${r.depart}`}
              className="grid grid-cols-2 items-center gap-x-4 gap-y-4 bg-mist px-[26px] py-[26px] lg:grid-cols-[1fr_1fr_1fr_140px_120px_170px] lg:gap-6"
            >
              <div>
                <span className="block font-display text-[24px] font-semibold uppercase leading-none text-navy">
                  {r.from}
                </span>
                <span className="mt-1 block font-body text-[14px] font-light text-navy/60">
                  {r.depart}
                </span>
              </div>

              <div className="text-center">
                <span className="font-body text-[14px] font-light text-navy/60">
                  {r.duration}
                </span>
              </div>

              <div>
                <span className="block font-display text-[24px] font-semibold uppercase leading-none text-navy">
                  {r.to}
                </span>
                <span className="mt-1 block font-body text-[14px] font-light text-navy/60">
                  {r.arrive}
                </span>
              </div>

              <div>
                <span className="block font-display text-[24px] font-semibold leading-none text-navy">
                  {r.price.toLocaleString("fr-FR")} Ar
                </span>
                <span className="mt-1 block font-body text-[12px] font-light text-navy/60">
                  par adulte
                </span>
              </div>

              <div>
                <span className="block font-display text-[24px] font-semibold leading-none text-stock">
                  {r.seats}
                </span>
                <span className="mt-1 block font-body text-[12px] font-light text-navy/60">
                  places restantes
                </span>
              </div>

              {/* Measured 98x26, no background, navy 16px/600 — a text link
                  with a trailing arrow, not a filled gold button. */}
              <Link
                href="/cart"
                className="inline-flex items-center gap-2 font-display text-[16px] font-semibold uppercase text-navy transition-colors duration-500 hover:text-gold"
              >
                Réserver
                <ArrowRight className="size-4" strokeWidth={2} />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
