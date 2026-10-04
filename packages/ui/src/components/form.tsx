import { cn } from "../lib/cn";

export type FormVariant = "app" | "site";

type FieldProps = {
  label?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
  variant?: FormVariant;
};

export function Field({ label, hint, error, children, className, variant = "app" }: FieldProps) {
  return (
    <label className={cn("block", className)}>
      {label && (
        <span className={cn(
          "block",
          variant === "site"
            ? "mb-2 font-body text-[14px] text-navy"
            : "mb-1.5 text-sm font-medium text-ink",
        )}>
          {label}
        </span>
      )}
      {children}
      {error
        ? <span className="mt-1 block text-xs font-medium text-danger">{error}</span>
        : hint && <span className="mt-1 block text-xs text-ink-soft/70">{hint}</span>}
    </label>
  );
}

const appControl = "w-full rounded-lg border border-line bg-paper px-4 text-sm text-ink outline-none transition-all placeholder:text-ink-soft/40 focus:border-laterite focus:ring-3 focus:ring-laterite/10 disabled:cursor-not-allowed disabled:opacity-60";
const siteControl = "w-full border border-navy/15 bg-white px-5 font-body text-[16px] text-navy outline-none transition-colors duration-300 placeholder:text-navy/35 focus:border-gold disabled:cursor-not-allowed disabled:opacity-60";

type InputProps = React.ComponentProps<"input"> & { variant?: FormVariant };
type TextareaProps = React.ComponentProps<"textarea"> & { variant?: FormVariant };
type SelectProps = React.ComponentProps<"select"> & { variant?: FormVariant };

export function Input({ className, variant = "app", ...props }: InputProps) {
  return <input className={cn(variant === "site" ? siteControl : appControl, variant === "site" ? "h-[60px]" : "h-11", className)} {...props} />;
}
export function Textarea({ className, variant = "app", ...props }: TextareaProps) {
  return <textarea className={cn(variant === "site" ? siteControl : appControl, variant === "site" ? "min-h-[120px] resize-y py-3.5" : "h-auto py-2.5", className)} {...props} />;
}
export function Select({ className, children, variant = "app", ...props }: SelectProps) {
  return <select className={cn(variant === "site" ? siteControl : appControl, variant === "site" ? "h-[60px]" : "h-11", "appearance-none bg-[length:1rem] pr-9", className)} {...props}>{children}</select>;
}
