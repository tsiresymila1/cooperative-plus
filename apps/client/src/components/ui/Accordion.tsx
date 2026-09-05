"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";

/* Shared accordion for the homepage FAQ block and the /faq page.
   Accepts either bare questions or question/answer pairs from the source. */

export default function Accordion({
  items,
  defaultOpen = null,
}: {
  /** a plain string renders a question with no answer body */
  items: (string | { q: string; a: string })[];
  defaultOpen?: number | null;
}) {
  const [open, setOpen] = useState<number | null>(defaultOpen);

  return (
    <ul className="border-t border-navy/10">
      {items.map((item, i) => {
        const q = typeof item === "string" ? item : item.q;
        const a = typeof item === "string" ? "" : item.a;
        const isOpen = open === i;
        return (
          <li key={q + i} className="border-b border-navy/10">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-6 py-[22px] text-left font-display text-[22px] font-semibold uppercase leading-[1.1] text-navy transition-colors duration-300 hover:text-gold"
            >
              {q}
              {isOpen ? (
                <Minus className="size-5 shrink-0 text-gold" />
              ) : (
                <Plus className="size-5 shrink-0 text-gold" />
              )}
            </button>
            <div
              className={`grid transition-[grid-template-rows] duration-500 ease-out ${
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                {a ? (
                  <p className="pb-[22px] pl-8 pr-4 font-body text-[16px] font-light leading-[25.6px] text-navy/70">
                    {a}
                  </p>
                ) : (
                  <div className="pb-[22px]" />
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
