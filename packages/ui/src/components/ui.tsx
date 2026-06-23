import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

/* Button — laterite-first, tactile. */
const button = cva(
  "inline-flex items-center justify-center gap-2 font-medium rounded-[--radius] transition-all duration-200 active:scale-[.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-laterite/60 disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-laterite text-paper hover:bg-laterite-deep",
        ink: "bg-strong text-white hover:bg-ink-soft",
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
    neutral: "bg-ink/[.06] text-ink-soft ring-1 ring-inset ring-ink/8",
    success: "bg-success/12 text-success ring-1 ring-inset ring-success/20",
    warning: "bg-warning/12 text-[#b45309] ring-1 ring-inset ring-warning/25",
    danger: "bg-danger/10 text-danger ring-1 ring-inset ring-danger/20",
  };
  return <span className={cn("inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold", tones[tone])}>{children}</span>;
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
  return <div className={cn("rounded-md border border-ink/8 bg-paper", className)}>{children}</div>;
}

export function StatCard({ label, value, hint, trend, tone = "ink", icon }: {
  label: string; value: string; hint?: string; trend?: "up" | "down";
  tone?: "ink" | "laterite" | "baobab"; icon?: React.ReactNode;
}) {
  const accent = { ink: "text-ink", laterite: "text-laterite", baobab: "text-baobab" }[tone];
  return (
    <Card className="p-5 transition-colors hover:border-ink/15">
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-soft/70">{label}</p>
        {icon && <span className="grid h-8 w-8 place-items-center rounded-lg bg-ink/[.04] text-ink-soft/70">{icon}</span>}
      </div>
      <p className={cn("mt-3 font-display text-[2rem] font-extrabold leading-none tabular-nums", accent)}>{value}</p>
      {hint && (
        <p className={cn("mt-2 inline-flex items-center gap-1 text-sm font-medium",
          trend === "up" ? "text-success" : trend === "down" ? "text-danger" : "text-ink-soft/70")}>
          {trend === "up" ? "↑" : trend === "down" ? "↓" : null} {hint}
        </p>
      )}
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

export function BrandMarkLong({ height = 30, width = 140, className }: { height?: number; width?: number | null; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/logo-long.png" alt="Cooperative Plus" height={height}
      className={cn("rounded-[22%] object-contain", className)} style={{ width: width ?? undefined, height }} />
  );
}

/** Cooperative logo with fallback to the Cooperative Plus default mark. */
export function CoopLogo({ url, name, size = 40, className }: { url?: string | null; name?: string; size?: number; className?: string }) {
  return (
    <span className={cn("grid shrink-0 place-items-center overflow-hidden rounded-xl", className)}
      style={{ width: size, height: size }}>
      {url
        ? <img src={url} alt={name ?? "logo"} className="h-full w-full object-cover" />
        // eslint-disable-next-line @next/next/no-img-element
        : <img src="/logo.svg" alt="Cooperative Plus" className="h-full w-full object-contain p-1" onError={(e) => { (e.currentTarget.style.display = "none"); }} />}
    </span>
  );
}

export function Logo({ className, withName = false, dark, width, height }: { className?: string; withName?: boolean; dark?: boolean; width?: number, height?: number }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-display text-lg font-bold tracking-tight", dark ? "text-paper" : "text-navy", className)}>
      <BrandMarkLong width={width} height={height} />
      {withName && <>Cooperative<span className="text-orange">+</span></>}
    </span>
  );
}

/* Spinner — circular loading indicator. */
export function Spinner({ size = 22, className }: { size?: number; className?: string }) {
  return (
    <span
      role="status"
      aria-label="Chargement"
      className={cn("inline-block animate-spin rounded-full border-2 border-ink/15 border-t-laterite", className)}
      style={{ width: size, height: size }}
    />
  );
}

/* Full-viewport centered spinner — replaces "Chargement…" screens. */
export function FullSpinner({ className }: { className?: string }) {
  return (
    <div className={cn("grid min-h-dvh place-items-center", className)}>
      <Spinner size={30} />
    </div>
  );
}

/* Skeleton — shimmer placeholder while data loads. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-[--radius] bg-ink/8", className)} />;
}

/* Page-level loading block: a few shimmer bars. */
export function PageSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}
