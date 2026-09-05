"use client";

import { useEffect, useRef, useState } from "react";
import { COUNTERS } from "./data";

/* Band 4562..4938 at 1440 (376 tall): 40px above the figure, a 240px-tall
   number, 96px below.
   Measured: the figure is 200px / 600 / line-height 200 in #eff3f4 — a pale
   watermark, not a gold headline — and the label is a 24px / 600 navy h4
   positioned absolutely *over* it (source has position:absolute on the h4).

   audit.json lists `lte-countup-animation` on these four, so the value counts
   up once in view. It renders at its final value first, so the figures are
   right with JS off and under reduced motion. */

const DURATION = 2000;

function useCountUp(target: number) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(target);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const p = Math.min((now - start) / DURATION, 1);
          setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);

  return { ref, value };
}

function Counter({ value, label }: { value: number; label: string }) {
  const { ref, value: shown } = useCountUp(value);
  return (
    <li className="relative flex h-[240px] items-center justify-center">
      <span
        ref={ref}
        aria-hidden
        className="font-display text-watermark font-semibold leading-[200px] text-mist"
      >
        {shown}
      </span>
      <h4 className="absolute left-1/2 top-1/2 w-[170px] -translate-x-1/2 -translate-y-1/2 text-center font-display text-[24px] font-semibold uppercase leading-9 text-navy">
        <span className="sr-only">{value} </span>
        {label}
      </h4>
    </li>
  );
}

export default function Counters({
  padding = "mt-[130px] pb-[33px] pt-[33px] lg:pb-[96px] lg:pt-[40px]",
}: {
  padding?: string;
} = {}) {
  return (
    <section className={padding}>
      <div className="mx-auto max-w-shell px-[15px]">
        {/* One per row at 390 (source spaces them 256px apart there), four
            across from lg. The figure keeps its 200px size at every width. */}
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">
          {COUNTERS.map((c) => (
            <Counter key={c.label} value={c.value} label={c.label} />
          ))}
        </ul>
      </div>
    </section>
  );
}
