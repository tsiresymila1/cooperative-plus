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
    let stop: (() => void) | undefined;
    const start = () => {
      const main = document.querySelector("main");
      if (!main) return false;
      stop = setup(main);
      return true;
    };
    // <main> can mount after this effect (providers render children late).
    const wait = start() ? null : new MutationObserver(() => start() && wait?.disconnect());
    wait?.observe(document.body, { childList: true, subtree: true });
    return () => {
      wait?.disconnect();
      stop?.();
    };
  }, []);

  return null;
}

function setup(main: Element) {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add("reveal-show");
          io.unobserve(e.target);
        }),
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );
    // Sections render client-side data later (destinations…), so re-tag on DOM changes.
    const tag = () =>
      main.querySelectorAll<HTMLElement>(":scope > :nth-child(n+3)").forEach((section) => {
        let i = 0;
        section.querySelectorAll<HTMLElement>(TARGETS).forEach((el) => {
          if (el.dataset.motion) return;
          el.dataset.motion = "1";
          // skip nested targets (li > p)
          if (el.parentElement?.closest("[data-motion='1']")) return;
          el.classList.add("reveal");
          el.style.transitionDelay = `${Math.min(i++, 6) * 70}ms`;
          el.addEventListener("transitionend", () => (el.style.transitionDelay = ""), { once: true });
          io.observe(el);
        });
      });
    tag();
    let pending = 0;
    const mo = new MutationObserver(() => {
      cancelAnimationFrame(pending);
      pending = requestAnimationFrame(tag);
    });
    mo.observe(main, { childList: true, subtree: true });

    if (reduced) return () => { io.disconnect(); mo.disconnect(); };
    const lenis = new Lenis({ duration: 1.1, anchors: true });
    let raf = requestAnimationFrame(function tick(t) {
      lenis.raf(t);
      raf = requestAnimationFrame(tick);
    });
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      io.disconnect();
      mo.disconnect();
    };
}
