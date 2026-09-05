"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Quote } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import { TESTIMONIALS } from "./data";

/* Source shows three cards at a time with prev/next arrows beside the heading,
   card content centred and the avatar above the name — not a 2x2 grid.
   Copy verbatim from the source. */

const PER_VIEW = 3;

export default function Testimonials({
  eyebrow = "Testimonials",
  title = "What our clients say",
  padding = "py-[110px]",
}: {
  eyebrow?: string;
  title?: string;
  padding?: string;
} = {}) {
  const [start, setStart] = useState(0);
  const max = Math.max(0, TESTIMONIALS.length - PER_VIEW);
  const shown = TESTIMONIALS.slice(start, start + PER_VIEW);

  return (
    <section className={`bg-mist ${padding}`}>
      <div className="mx-auto max-w-shell px-[15px]">
        <div className="mb-[50px] flex items-end justify-between gap-8">
          <SectionHeading eyebrow={eyebrow} title={title} />

          <div className="hidden shrink-0 gap-3 lg:flex">
            <button
              type="button"
              aria-label="Previous testimonials"
              onClick={() => setStart((s) => Math.max(0, s - 1))}
              disabled={start === 0}
              className="flex size-[46px] items-center justify-center rounded-full border border-navy/20 text-navy transition-colors duration-500 hover:border-gold hover:text-gold disabled:opacity-40"
            >
              <ArrowLeft className="size-4" strokeWidth={2} />
            </button>
            <button
              type="button"
              aria-label="Next testimonials"
              onClick={() => setStart((s) => Math.min(max, s + 1))}
              disabled={start >= max}
              className="flex size-[46px] items-center justify-center rounded-full border border-navy/20 text-navy transition-colors duration-500 hover:border-gold hover:text-gold disabled:opacity-40"
            >
              <ArrowRight className="size-4" strokeWidth={2} />
            </button>
          </div>
        </div>

        <div className="grid gap-[30px] sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((t) => (
            <figure
              key={t.author}
              className="flex flex-col items-center bg-white px-[45px] py-[80px] text-center"
            >
              <Quote className="mb-6 size-8 text-gold" strokeWidth={1.5} />
              <blockquote className="font-body text-[16px] font-light leading-[25.6px] text-navy/70">
                {t.quote}
              </blockquote>
              <figcaption className="mt-[26px] flex flex-col items-center gap-3">
                <Image
                  src={t.avatar}
                  alt=""
                  width={80}
                  height={80}
                  className="size-[80px] shrink-0 rounded-full object-cover"
                />
                <span className="font-display text-[22px] font-semibold uppercase tracking-[0.5px] text-navy">
                  {t.author}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
