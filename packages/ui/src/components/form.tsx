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

const base = "h-11 w-full rounded-lg border border-line bg-paper px-4 text-sm text-ink outline-none transition-all placeholder:text-ink-soft/40 focus:border-laterite focus:ring-3 focus:ring-laterite/10 disabled:cursor-not-allowed disabled:opacity-60";

export function Input({ className, ...p }: React.ComponentProps<"input">) {
  return <input className={cn(base, className)} {...p} />;
}
export function Textarea({ className, ...p }: React.ComponentProps<"textarea">) {
  return <textarea className={cn(base, "h-auto py-2.5", className)} {...p} />;
}
export function Select({ className, children, ...p }: React.ComponentProps<"select">) {
  return <select className={cn(base, "appearance-none bg-[length:1rem] pr-9", className)} {...p}>{children}</select>;
}
