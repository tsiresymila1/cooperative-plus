"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { db, notDeleted } from "@cp/ui";
import SectionHeading from "@/components/ui/SectionHeading";

/* Custom destination marker — a pin carrying the brand chevron (not a lucide
   icon). Inherits currentColor. */
function DestIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M12 0C5.7 0 .6 5.1.6 11.4.6 20 12 32 12 32s11.4-12 11.4-20.6C23.4 5.1 18.3 0 12 0Z" fill="currentColor" />
      <path d="M9 6.5 16 12l-7 5.5V13l3-1-3-1V6.5Z" fill="#14314C" />
    </svg>
  );
}

/* Template "Popular destinations" band — same layout; real Coopérative Plus
   destinations. Branded gradient cards (no stock photos) + custom marker icon. */
export default function Destinations({ padding = "py-[45px] lg:py-[67px]" }: { padding?: string } = {}) {
  const { data } = db.useQuery({ destinations: { $: { where: { isGlobal: true }, order: { name: "asc" } } } });
  const all = [...new Map((data?.destinations ?? []).filter(notDeleted).map((d: any) => [d.name, d])).values()] as any[];
  const featured = all.filter((d) => d.isPopular).concat(all.filter((d) => !d.isPopular)).slice(0, 4);
  const rest = all.slice(0, 18);

  const GRAD = [
    "linear-gradient(155deg,#1c3d5c 0%,#14314C 55%,#0f2740 100%)",
    "linear-gradient(155deg,#14314C 0%,#0f2740 60%,#0b1f30 100%)",
    "linear-gradient(155deg,#1c3d5c 0%,#12314a 55%,#0d243a 100%)",
    "linear-gradient(155deg,#173350 0%,#14314C 55%,#0f2740 100%)",
  ];

  return (
    <section className={padding}>
      <div className="mx-auto max-w-shell px-[15px]">
        <SectionHeading eyebrow="Voyageons ensemble" title="Destinations populaires" className="mb-[20px] lg:mb-[50px]" />

        <div className="grid grid-cols-1 gap-[30px] sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((d, i) => (
            <Link
              key={d.id ?? d.name}
              href={`/search?to=${encodeURIComponent(d.name)}&pax=1`}
              className="group relative block h-[357px] overflow-hidden lg:h-[490px]"
              style={{ background: GRAD[i % GRAD.length] }}
            >
              {/* faint marker watermark */}
              <DestIcon className="pointer-events-none absolute -right-6 -top-8 h-56 w-56 text-white/[0.06] transition-transform duration-700 group-hover:scale-110" />
              <span className="absolute left-[26px] top-[26px] inline-flex h-11 w-11 items-center justify-center rounded-full bg-gold/15 text-gold ring-1 ring-gold/30">
                <DestIcon className="h-5 w-5" />
              </span>
              <span className="absolute inset-x-0 bottom-0 flex items-center gap-3 p-[26px]">
                <span className="font-display text-[22px] font-semibold uppercase leading-none tracking-[0.5px] text-white">{d.name}</span>
                <ArrowRight className="ml-auto size-5 text-white transition-colors duration-500 group-hover:text-gold" strokeWidth={1.5} />
              </span>
            </Link>
          ))}
        </div>

        {rest.length > 0 && (
          <ul className="mt-[20px] grid grid-cols-2 gap-[10px] sm:grid-cols-3 lg:mt-[50px] lg:grid-cols-6">
            {rest.map((c) => (
              <li key={c.id ?? c.name}>
                <Link href={`/search?to=${encodeURIComponent(c.name)}&pax=1`} className="flex h-[55px] items-center gap-3 border border-navy/10 px-[18px] font-body text-[14px] font-normal text-navy transition-colors duration-500 hover:border-gold hover:text-gold">
                  <DestIcon className="h-4 w-3.5 shrink-0 text-gold" />
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
