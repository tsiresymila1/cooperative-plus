"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";

/* Source shop sidebar (widget-area, column at x=80): a product search and cart
   widget, product categories with counts, a price filter with a working
   two-handle slider, and a tag cloud whose tags toggle on click. */

const CATEGORIES = [
  { label: "Booking", count: 0, href: "/category/booking" },
  { label: "Bus", count: 5, href: "#" },
  { label: "Charters", count: 1, href: "/category/charters" },
  { label: "Comfort", count: 0, href: "#" },
  { label: "Tickets", count: 0, href: "#" },
  { label: "Travel", count: 3, href: "#" },
];

const TAGS = ["booking", "bus", "comfort", "restaurant", "tickets", "travel"];

const MIN = 10;
const MAX = 130;

export default function ShopSidebar() {
  const [lo, setLo] = useState(MIN);
  const [hi, setHi] = useState(MAX);
  const [active, setActive] = useState<Set<string>>(new Set());

  const pct = (v: number) => ((v - MIN) / (MAX - MIN)) * 100;

  const toggleTag = (t: string) =>
    setActive((prev) => {
      const next = new Set(prev);
      next.has(t) ? next.delete(t) : next.add(t);
      return next;
    });

  return (
    <aside className="space-y-[50px]">
      <form className="relative">
        <input
          type="search"
          name="s"
          placeholder="Search products…"
          aria-label="Search products"
          className="h-[56px] w-full border border-navy/15 bg-white pl-5 pr-14 font-body text-[16px] text-navy outline-none transition-colors duration-300 focus:border-gold"
        />
        <button
          type="submit"
          aria-label="Search"
          className="absolute right-0 top-0 flex h-[56px] w-[56px] items-center justify-center bg-gold text-navy transition-colors duration-[250ms] hover:bg-navy hover:text-white"
        >
          <Search className="size-5" strokeWidth={1.8} />
        </button>
      </form>

      <div>
        <h4 className="mb-[22px] font-display text-[24px] font-semibold uppercase text-navy">
          Cart
        </h4>
        <p className="font-body text-[14px] text-navy/60">
          No products in the cart.
        </p>
      </div>

      <div>
        <h4 className="mb-[22px] font-display text-[24px] font-semibold uppercase text-navy">
          Product Categories
        </h4>
        <ul>
          {CATEGORIES.map((c) => (
            <li key={c.label} className="border-b border-navy/10 last:border-0">
              <Link
                href={c.href}
                className="flex h-[46px] items-center justify-between font-body text-[14px] text-navy transition-colors duration-500 hover:text-gold"
              >
                <span className="flex items-center gap-2">
                  <ChevronRight className="size-3.5 text-gold" strokeWidth={2} />
                  {c.label}
                </span>
                <span className="text-navy/40">({c.count})</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h4 className="mb-[22px] font-display text-[24px] font-semibold uppercase text-navy">
          Filter by Price
        </h4>

        {/* Two-handle range slider: the track fills between the low and high
            handles, and both inputs are draggable (they were static before). */}
        <div className="relative h-4">
          <span className="absolute top-1/2 h-[3px] w-full -translate-y-1/2 rounded bg-navy/15" />
          <span
            className="absolute top-1/2 h-[3px] -translate-y-1/2 rounded bg-gold"
            style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }}
          />
          <input
            type="range"
            min={MIN}
            max={MAX}
            value={lo}
            onChange={(e) => setLo(Math.min(Number(e.target.value), hi))}
            aria-label="Minimum price"
            className="range-thumb pointer-events-none absolute inset-0 h-4 w-full appearance-none bg-transparent"
          />
          <input
            type="range"
            min={MIN}
            max={MAX}
            value={hi}
            onChange={(e) => setHi(Math.max(Number(e.target.value), lo))}
            aria-label="Maximum price"
            className="range-thumb pointer-events-none absolute inset-0 h-4 w-full appearance-none bg-transparent"
          />
        </div>

        <div className="mt-5 flex items-center justify-between">
          <span className="font-body text-[14px] text-navy">
            Price: ${lo} — ${hi}
          </span>
          <button
            type="button"
            className="bg-gold px-5 py-2 font-display text-[14px] font-semibold uppercase tracking-[0.5px] text-navy transition-colors duration-[250ms] hover:bg-navy hover:text-white"
          >
            Filter
          </button>
        </div>
      </div>

      <div>
        <h4 className="mb-[22px] font-display text-[24px] font-semibold uppercase text-navy">
          Product Tags
        </h4>
        <ul className="flex flex-wrap gap-2">
          {TAGS.map((t) => {
            const on = active.has(t);
            return (
              <li key={t}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleTag(t)}
                  className={`block border px-4 py-2 font-body text-[13px] uppercase transition-colors duration-300 ${
                    on
                      ? "border-gold bg-gold text-navy"
                      : "border-navy/15 text-navy hover:border-gold hover:text-gold"
                  }`}
                >
                  {t}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
