import Link from "next/link";
import { ArrowRight } from "lucide-react";

/* The source's inline "Read more" — 16px/600 display face with a trailing
   arrow, not the gold CtaButton. Used in the sections that carry a link rather
   than a filled call to action. */

export default function TextLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 font-display text-[16px] font-semibold uppercase text-navy transition-colors duration-500 hover:text-gold ${className}`}
    >
      {children}
      <ArrowRight className="size-4" strokeWidth={2} />
    </Link>
  );
}
