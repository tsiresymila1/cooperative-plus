"use client";
import * as React from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "../lib/cn";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

export type ComboOption = { value: string; label: string; hint?: string };

export function Combobox({
  value,
  onValueChange,
  options,
  placeholder = "Sélectionner…",
  searchPlaceholder = "Rechercher…",
  empty = "Aucun résultat.",
  icon,
  disabled,
  className,
}: {
  value: string;
  onValueChange: (v: string) => void;
  options: ComboOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  empty?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const selected = options.find((o) => o.value === value);
  const filtered = q
    ? options.filter((o) => `${o.label} ${o.hint ?? ""}`.toLowerCase().includes(q.toLowerCase()))
    : options;

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setQ(""); }}>
      <PopoverTrigger asChild disabled={disabled}>
        <button
          type="button"
          className={cn(
            "flex h-9 w-full items-center justify-between gap-2 rounded-[--radius] border border-ink/12 bg-paper px-3 text-sm text-ink outline-none focus:border-laterite/60 disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
        >
          <span className="inline-flex min-w-0 items-center gap-2">
            {icon}
            <span className={cn("truncate", !selected && "text-ink-soft/60")}>{selected?.label ?? placeholder}</span>
          </span>
          <ChevronsUpDown size={15} className="shrink-0 text-ink-soft/50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <div className="flex items-center gap-2 border-b border-ink/8 px-3">
          <Search size={14} className="text-ink-soft/50" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-ink-soft/50"
          />
        </div>
        <div className="max-h-56 overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <p className="px-2 py-3 text-center text-xs text-ink-soft/60">{empty}</p>
          ) : (
            filtered.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => { onValueChange(o.value); setOpen(false); setQ(""); }}
                className="flex w-full items-center justify-between gap-2 rounded-[calc(var(--radius)-2px)] px-2 py-1.5 text-left text-sm hover:bg-ink/5"
              >
                <span className="min-w-0">
                  <span className="block truncate text-ink">{o.label}</span>
                  {o.hint && <span className="block truncate text-xs text-ink-soft/60">{o.hint}</span>}
                </span>
                {o.value === value && <Check size={15} className="shrink-0 text-laterite" />}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
