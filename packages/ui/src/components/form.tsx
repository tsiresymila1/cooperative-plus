import { cn } from "../lib/cn";

export function Field({ label, hint, error, children, className }: { label?: string; hint?: string; error?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("block", className)}>
      {label && <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>}
      {children}
      {error
        ? <span className="mt-1 block text-xs font-medium text-danger">{error}</span>
        : hint && <span className="mt-1 block text-xs text-ink-soft/70">{hint}</span>}
    </label>
  );
}

const base = "h-11 w-full rounded-[--radius] border border-ink/12 bg-paper px-3.5 text-[15px] text-ink outline-none transition-all placeholder:text-ink-soft/40 focus:border-orange focus:ring-2 focus:ring-orange/20";

export function Input({ className, ...p }: React.ComponentProps<"input">) {
  return <input className={cn(base, className)} {...p} />;
}
export function Textarea({ className, ...p }: React.ComponentProps<"textarea">) {
  return <textarea className={cn(base, "h-auto py-2.5", className)} {...p} />;
}
export function Select({ className, children, ...p }: React.ComponentProps<"select">) {
  return <select className={cn(base, "appearance-none bg-[length:1rem] pr-9", className)} {...p}>{children}</select>;
}
