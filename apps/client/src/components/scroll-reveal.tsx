"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Fades `.reveal` elements up as they scroll into view (all browsers).
 *  Re-scans on every route change. Has a safety net so content is NEVER left
 *  hidden if the observer fails to fire (the bug seen in production). */
export function ScrollReveal() {
  const pathname = usePathname();
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("reveal-ready");

    const revealAll = () =>
      document
        .querySelectorAll<HTMLElement>(".reveal:not(.reveal-show)")
        .forEach((e) => e.classList.add("reveal-show"));

    let io: IntersectionObserver | null = null;

    const setup = () => {
      const els = Array.from(document.querySelectorAll<HTMLElement>(".reveal:not(.reveal-show)"));
      if (!els.length) return;
      if (!("IntersectionObserver" in window)) {
        revealAll();
        return;
      }
      io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) {
              e.target.classList.add("reveal-show");
              io?.unobserve(e.target);
            }
          }
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
      );
      els.forEach((e) => io!.observe(e));
    };

    const raf = requestAnimationFrame(setup);
    // Safety net: if the observer never fires (prod edge cases), reveal anyway.
    const fallback = setTimeout(revealAll, 1500);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(fallback);
      io?.disconnect();
    };
  }, [pathname]);

  return null;
}
