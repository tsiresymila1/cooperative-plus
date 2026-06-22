import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

/* Button — laterite-first, tactile. */
const button = cva(
  "inline-flex items-center justify-center gap-2 font-medium rounded-[--radius] transition-all duration-200 active:scale-[.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-laterite/60 disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-laterite text-paper hover:bg-laterite-deep shadow-sm",
        ink: "bg-ink text-sand hover:bg-ink-soft",
        outline: "border border-ink/15 bg-paper/60 text-ink hover:bg-paper backdrop-blur",
        ghost: "text-ink hover:bg-ink/5",
      },
      size: { sm: "h-9 px-3 text-sm", md: "h-11 px-5 text-[15px]", lg: "h-13 px-7 text-base" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export function Button({ className, variant, size, ...p }: React.ComponentProps<"button"> & VariantProps<typeof button>) {
  return <button className={cn(button({ variant, size }), className)} {...p} />;
}

export function Badge({ tone = "neutral", children }: { tone?: "neutral" | "success" | "warning" | "danger"; children: React.ReactNode }) {
  const tones = {
    neutral: "bg-ink/8 text-ink-soft",
    success: "bg-baobab/12 text-baobab",
    warning: "bg-clay/15 text-[#9a5a16]",
    danger: "bg-laterite/12 text-laterite-deep",
  };
  return <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", tones[tone])}>{children}</span>;
}

/** Settings/form section: numbered label + description on the left, card on the right. */
export function FormSection({ index, title, description, children, className }: {
  index?: string; title: string; description?: string; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn("grid gap-5 border-b border-ink/8 py-8 first:pt-4 last:border-0 md:grid-cols-[260px_1fr]", className)}>
      <div className="md:pr-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft/70">
          {index && <span className="mr-1.5 text-laterite">{index}</span>}{title}
        </p>
        {description && <p className="mt-2 text-sm leading-relaxed text-ink-soft/80">{description}</p>}
      </div>
      <Card className="p-6">{children}</Card>
    </div>
  );
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("rounded-sm border border-ink/8 bg-paper shadow-[0_1px_2px_rgba(15,28,82,.05)]", className)}>{children}</div>;
}

export function StatCard({ label, value, hint, tone = "ink" }: { label: string; value: string; hint?: string; tone?: "ink" | "laterite" | "baobab" }) {
  const accent = { ink: "text-ink", laterite: "text-laterite", baobab: "text-baobab" }[tone];
  return (
    <Card className="relative overflow-hidden p-5">
      <p className="text-xs font-medium uppercase tracking-widest text-ink-soft/70">{label}</p>
      <p className={cn("mt-3 font-display text-4xl font-bold tabular-nums", accent)}>{value}</p>
      {hint && <p className="mt-1 text-sm text-ink-soft/70">{hint}</p>}
      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-clay/10 blur-2xl" />
    </Card>
  );
}

/* Uses the brand logo SVG. File at apps/<app>/public/logo.svg */
export function BrandMark({ size = 40, className }: { size?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/logo-round.png" alt="Cooperative Plus" width={size} height={size}
      className={cn("rounded-[22%] object-contain", className)} style={{ width: size, height: size }} />
  );
}

/** Cooperative logo with fallback to the Cooperative Plus default mark. */
export function CoopLogo({ url, name, size = 40, className }: { url?: string | null; name?: string; size?: number; className?: string }) {
  return (
    <span className={cn("grid shrink-0 place-items-center overflow-hidden rounded-xl border border-ink/10 bg-sand", className)}
      style={{ width: size, height: size }}>
      {url
        ? <img src={url} alt={name ?? "logo"} className="h-full w-full object-cover" />
        // eslint-disable-next-line @next/next/no-img-element
        : <img src="/logo.svg" alt="Cooperative Plus" className="h-full w-full object-contain p-1" onError={(e) => { (e.currentTarget.style.display = "none"); }} />}
    </span>
  );
}

export function Logo({ className, withName = true, dark }: { className?: string; withName?: boolean; dark?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-display text-lg font-bold tracking-tight", dark ? "text-paper" : "text-navy", className)}>
      <BrandMark size={32} />
      {withName && <>Cooperative<span className="text-orange">+</span></>}
    </span>
  );
}
