"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import { TEAM } from "./team";

/* "Meet our stewards" on /home-tours-2 — band 6003..6912 (909 tall).
   Source drives it with Swiper: 4 per view at desktop, 2 at tablet, 1 at
   mobile (`data-breakpoints="4;4;2;2;2;1"`), 30px between slides, arrows
   outside. Cards are 360x500 photos with the name and role beneath. */

const PER_VIEW = 4;

export default function Team({ padding = "py-[110px]" }: { padding?: string } = {}) {
  const [start, setStart] = useState(0);
  const max = Math.max(0, TEAM.length - PER_VIEW);
  const shown = TEAM.slice(start, start + PER_VIEW);

  return (
    <section className={padding}>
      <div className="mx-auto max-w-shell px-[15px]">
        <div className="mb-[50px] flex items-end justify-between gap-8">
          <SectionHeading eyebrow="Our team" title="Meet our stewards" />

          <div className="hidden shrink-0 gap-3 lg:flex">
            <button
              type="button"
              aria-label="Previous team members"
              onClick={() => setStart((s) => Math.max(0, s - 1))}
              disabled={start === 0}
              className="flex size-[46px] items-center justify-center rounded-full border border-navy/20 text-navy transition-colors duration-500 hover:border-gold hover:text-gold disabled:opacity-40"
            >
              <ArrowLeft className="size-4" strokeWidth={2} />
            </button>
            <button
              type="button"
              aria-label="Next team members"
              onClick={() => setStart((s) => Math.min(max, s + 1))}
              disabled={start >= max}
              className="flex size-[46px] items-center justify-center rounded-full border border-navy/20 text-navy transition-colors duration-500 hover:border-gold hover:text-gold disabled:opacity-40"
            >
              <ArrowRight className="size-4" strokeWidth={2} />
            </button>
          </div>
        </div>

        <div className="grid gap-[30px] sm:grid-cols-2 lg:grid-cols-4">
          {shown.map((m) => (
            <article key={m.img} className="group">
              <Link
                href={m.href || "#"}
                className="relative block aspect-[360/500] overflow-hidden"
              >
                <Image
                  src={m.img}
                  alt={m.name}
                  fill
                  sizes="(max-width: 1024px) 50vw, 360px"
                  className="object-cover transition-[transform,scale] duration-700 ease-out group-hover:scale-110"
                />
              </Link>

              <div className="pt-[22px]">
                <h4 className="font-display text-[22px] font-semibold uppercase tracking-[0.5px] text-navy">
                  <Link
                    href={m.href || "#"}
                    className="transition-colors duration-500 hover:text-gold"
                  >
                    {m.name}
                  </Link>
                </h4>
                <p className="mt-1 font-body text-[14px] font-light text-navy/60">
                  {m.role}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
