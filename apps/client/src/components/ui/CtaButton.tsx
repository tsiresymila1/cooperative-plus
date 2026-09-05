import Link from "next/link";

/* The theme's own CTA, kept separate from shadcn's `button.tsx` (a
   case-insensitive filesystem makes `Button.tsx` and `button.tsx` the same file).
   Measured: a.lte-btn 170x70, Barlow Condensed 600 / 16px, padding 22px 24px,
   bg #ceb45f, colour #002c3f, square corners. parity.mjs drove the real
   hover: background gold -> navy and text navy -> white over 0.25s (an earlier
   reading of interactions.css had it flipping to white over 0.5s). */

export default function CtaButton({
  href,
  children,
  variant = "gold",
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "gold" | "outline";
  className?: string;
}) {
  const base =
    "inline-flex h-[70px] items-center justify-center px-6 font-display text-[16px] font-semibold uppercase tracking-[0.5px] transition-colors duration-[250ms] ease-out";
  const tone =
    variant === "gold"
      ? "bg-gold text-navy hover:bg-navy hover:text-white"
      : "border border-white/40 text-white hover:border-gold hover:text-gold";

  return (
    <Link href={href} className={`${base} ${tone} ${className}`}>
      {children}
    </Link>
  );
}
