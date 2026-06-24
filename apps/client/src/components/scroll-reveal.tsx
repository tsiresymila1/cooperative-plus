"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Fades `.reveal` elements up as they scroll into view (all browsers).
 *  Re-scans on every route change (App Router keeps the layout mounted). */
export function ScrollReveal() {
  const pathname = usePathname();
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("reveal-ready");
    let io: IntersectionObserver | null = null;

    // Wait a frame so the freshly navigated page's DOM is painted.
    const raf = requestAnimationFrame(() => {
      const els = Array.from(document.querySelectorAll<HTMLElement>(".reveal:not(.reveal-show)"));
      if (!("IntersectionObserver" in window)) {
        els.forEach((e) => e.classList.add("reveal-show"));
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
        { rootMargin: "0px 0px -10% 0px", threshold: 0.1 },
      );
      els.forEach((e) => io!.observe(e));
    });

    return () => {
      cancelAnimationFrame(raf);
      io?.disconnect();
    };
  }, [pathname]);

  return null;
}
