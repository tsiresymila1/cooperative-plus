"use client";

import { useState } from "react";
import Image from "next/image";
import SectionHeading from "@/components/ui/SectionHeading";
import TextLink from "@/components/ui/TextLink";
import { Plus, Minus } from "lucide-react";
import { FAQ_ITEMS } from "./faqs";

/* Band y7645..8777 at 1440. Accordion beside faq.jpg.
   Answers come from the source accordions (`e-n-accordion-item` panels); an
   earlier pass wrongly reported them as empty and shipped blank panels. */

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="py-[148px] lg:py-[154px]">
      <div className="mx-auto max-w-shell px-[15px]">
        {/* Source order: accordion column first, image second. They were the
            other way round here. */}
        <div className="grid items-center gap-[60px] lg:grid-cols-2">
          <div>
            <SectionHeading
              eyebrow="Questions & réponses"
              title={
                <>
                  Questions fréquentes
                  <br />
                  sur nos trajets
                </>
              }
              className="mb-[40px]"
            />

            <ul className="border-t border-dashed border-navy/20">
              {FAQ_ITEMS.map(({ q, a }, i) => {
                const isOpen = open === i;
                return (
                  <li key={q} className="border-b border-dashed border-navy/20">
                    <button
                      type="button"
                      onClick={() => setOpen(isOpen ? null : i)}
                      aria-expanded={isOpen}
                      /* Measured: 18px / 600 Plus Jakarta Sans, sentence case,
                         navy, on an 80px row, with the marker on the LEFT. */
                      className="flex w-full items-center gap-4 py-[27px] text-left font-body text-[18px] font-semibold leading-[26px] text-navy transition-colors duration-300 hover:text-gold"
                    >
                      {isOpen ? (
                        <Minus className="size-4 shrink-0 text-gold" />
                      ) : (
                        <Plus className="size-4 shrink-0 text-gold" />
                      )}
                      {q}
                    </button>
                    <div
                      className={`grid transition-[grid-template-rows] duration-500 ease-out ${
                        isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <p className="pb-[22px] pl-8 pr-4 font-body text-[16px] font-light leading-[25.6px] text-navy/70">
                          {a}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <TextLink href="/faq" className="mt-[40px]">
              En savoir plus
            </TextLink>
          </div>

          <div className="relative aspect-[4/5] w-full overflow-hidden">
            <Image
              src="/wp-content/uploads/2025/02/faq.jpg"
              alt=""
              fill
              sizes="(max-width: 1024px) 100vw, 600px"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
