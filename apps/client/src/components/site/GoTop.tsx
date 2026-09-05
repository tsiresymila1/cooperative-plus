"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

/* motion.json scrollAnims[0]: `.lte-go-top` fades 0 -> 1 over 200ms,
   triggerY 540. Same threshold, same duration. */
const TRIGGER_Y = 540;

export default function GoTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > TRIGGER_Y);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Go Top"
      className={`fixed bottom-10 right-10 z-30 hidden size-[50px] items-center justify-center bg-gold text-navy transition-opacity duration-200 ease-out hover:bg-white md:flex ${
        show ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <ArrowUp className="size-5" strokeWidth={2} />
      <span className="sr-only">Go Top</span>
    </button>
  );
}
