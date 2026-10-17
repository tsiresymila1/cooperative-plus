"use client";
import { useEffect } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

/* Home only: Lenis smooth scroll + staggered reveal of each section's content.
   Tags elements with `.reveal` (styled in globals.css, observed by
   <ScrollReveal/> in the layout), so layout/design stay untouched. */
const TARGETS = "h2, h3, p, li, details, figure, form, button, a[class*='bg-']";

export function HomeMotion() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    document.querySelectorAll<HTMLElement>("main > :nth-child(n+3)").forEach((section) => {
      let i = 0;
      section.querySelectorAll<HTMLElement>(TARGETS).forEach((el) => {
        // skip nested targets (li > p) and anything already animated
        if (el.closest(".reveal") && el.closest(".reveal") !== section) return;
        if (el.classList.contains("reveal")) return;
        el.classList.add("reveal");
        el.style.transitionDelay = `${Math.min(i++, 6) * 70}ms`;
        el.addEventListener("transitionend", () => (el.style.transitionDelay = ""), { once: true });
      });
    });

    if (reduced) return;
    const lenis = new Lenis({ duration: 1.1, anchors: true });
    let raf = requestAnimationFrame(function tick(t) {
      lenis.raf(t);
      raf = requestAnimationFrame(tick);
    });
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, []);

  return null;
}
