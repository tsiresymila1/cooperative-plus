import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";
import { BrandLogo } from "./logo";

/* Button — TailAdmin: gold primary, hairline outline. */
const button = cva(
  "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 active:scale-[.98] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-laterite/20 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-laterite text-[#14314C] font-semibold shadow-[var(--shadow-card)] hover:bg-laterite-deep",
        ink: "bg-strong text-white hover:bg-ink-soft",
        outline: "border border-line bg-paper text-ink shadow-[var(--shadow-card)] hover:bg-ink/[.03]",
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
    neutral: "bg-ink/[.06] text-ink-soft dark:bg-white/5",
    success: "bg-success/15 text-success dark:bg-success/15",
    warning: "bg-warning/15 text-[#b45309] dark:text-warning",
    danger: "bg-danger/15 text-danger",
  };
  return <span className={cn("inline-flex items-center justify-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium", tones[tone])}>{children}</span>;
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
  return <div className={cn("rounded-2xl border border-line bg-paper shadow-[var(--shadow-card)]", className)}>{children}</div>;
}

/** TailAdmin content card: title/desc header + bordered body. */
export function ComponentCard({ title, desc, action, className, bodyClassName, children }: {
  title?: string; desc?: string; action?: React.ReactNode; className?: string; bodyClassName?: string; children: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-2xl border border-line bg-paper", className)}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-3 px-6 py-5">
          <div>
            {title && <h3 className="text-base font-medium text-ink">{title}</h3>}
            {desc && <p className="mt-1 text-sm text-ink-soft">{desc}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={cn("border-t border-line p-4 sm:p-6", bodyClassName)}>{children}</div>
    </div>
  );
}

export function StatCard({ label, value, hint, trend, tone = "ink", icon }: {
  label: string; value: string; hint?: string; trend?: "up" | "down";
  tone?: "ink" | "laterite" | "baobab"; icon?: React.ReactNode;
}) {
  const accent = { ink: "text-ink", laterite: "text-laterite", baobab: "text-baobab" }[tone];
  return (
    <Card className="p-5 transition-colors hover:border-ink/15 md:p-6">
      {icon && (
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-ink/[.04] text-ink-soft dark:bg-white/5">{icon}</span>
      )}
      <div className={cn("flex items-end justify-between", icon && "mt-5")}>
        <div>
          <p className="text-sm text-ink-soft">{label}</p>
          <p className={cn("mt-2 font-display text-[1.75rem] font-bold leading-none tabular-nums", accent)}>{value}</p>
        </div>
        {hint && (
          <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
            trend === "up" ? "bg-success/15 text-success" : trend === "down" ? "bg-danger/15 text-danger" : "bg-ink/[.06] text-ink-soft")}>
            {trend === "up" ? "↑" : trend === "down" ? "↓" : null} {hint}
          </span>
        )}
      </div>
    </Card>
  );
}

/* Uses the brand logo SVG. File at apps/<app>/public/logo.svg */
export function BrandMark({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <span className={cn("inline-grid place-items-center rounded-[22%] bg-strong", className)} style={{ width: size, height: size }}>
      <BrandLogo markOnly tone="light" className="w-[62%]" />
    </span>
  );
}

export function BrandMarkLong({ height = 30, width = 140, className, dark }: { height?: number; width?: number | null; className?: string; dark?: boolean }) {
  return (
    <span className={cn("inline-block", className)} style={{ height, width: width ?? undefined }}>
      <BrandLogo tone={dark ? "light" : "dark"} className="h-full w-auto" />
    </span>
  );
}

/** Cooperative logo with fallback to the Cooperative Plus default mark. */
export function CoopLogo({ url, name, size = 40, className }: { url?: string | null; name?: string; size?: number; className?: string }) {
  return (
    <span className={cn("grid shrink-0 place-items-center overflow-hidden rounded-xl", className)}
      style={{ width: size, height: size }}>
      {url
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={url} alt={name ?? "logo"} className="h-full w-full object-cover"
            onError={(e) => {
              const img = e.currentTarget;
              if (img.dataset.fb) { img.style.display = "none"; return; } // fallback also failed
              img.dataset.fb = "1";
              img.src = "/logo.svg";
              img.className = "h-full w-full object-contain p-1";
            }} />
        // eslint-disable-next-line @next/next/no-img-element
        : <img src="/logo.svg" alt="Cooperative Plus" className="h-full w-full object-contain p-1" onError={(e) => { (e.currentTarget.style.display = "none"); }} />}
    </span>
  );
}

/** Trip tag badge — white text on the tag's colour. */
export function TagBadge({ name, color, className }: { name: string; color?: string | null; className?: string }) {
  return (
    <span
      className={cn("inline-flex items-center rounded-xl px-4 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm", className)}
      style={{ backgroundColor: color || "#14314C" }}
    >
      {name}
    </span>
  );
}

export function Logo({ className, dark, width, height = 40 }: { className?: string; withName?: boolean; dark?: boolean; width?: number, height?: number }) {
  return <BrandMarkLong dark={dark} height={height} width={width ?? null} className={className} />;
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
