"use client";
import { Clock } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { cn } from "../lib/cn";

const pad = (n: number) => String(n).padStart(2, "0");
const HOURS = Array.from({ length: 24 }, (_, i) => pad(i));
const MINUTES = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];

/** shadcn-style time picker. Value/onChange are "HH:MM" strings. */
export function TimePicker({ value, onChange, placeholder = "Heure", className }: {
  value?: string; onChange?: (v: string) => void; placeholder?: string; className?: string;
}) {
  const [h, m] = (value ?? "").split(":");
  const set = (nh: string, nm: string) => onChange?.(`${nh}:${nm}`);

  return (
    <Popover>
      <PopoverTrigger
        className={cn("flex h-11 w-full items-center gap-2 rounded-[--radius] border border-ink/12 bg-paper px-3.5 text-left text-[15px] outline-none transition-all focus:border-orange focus:ring-2 focus:ring-orange/20", className)}>
        <Clock size={16} className="shrink-0 text-ink-soft/60" />
        <span className={cn(value ? "text-ink" : "text-ink-soft/50")}>{value || placeholder}</span>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <div className="flex h-56">
          <Col items={HOURS} active={h} onPick={(x) => set(x, m || "00")} />
          <div className="w-px bg-ink/8" />
          <Col items={MINUTES} active={m} onPick={(x) => set(h || "00", x)} />
        </div>
      </PopoverContent>
    </Popover>
  );
}

function Col({ items, active, onPick }: { items: string[]; active?: string; onPick: (v: string) => void }) {
  return (
    <div className="w-16 overflow-y-auto p-1.5">
      {items.map((it) => (
        <button key={it} type="button" onClick={() => onPick(it)}
          className={cn("mb-0.5 w-full rounded-[calc(var(--radius)-4px)] py-1.5 text-center font-mono text-sm transition-colors",
            active === it ? "bg-orange text-white" : "text-ink hover:bg-orange/10")}>
          {it}
        </button>
      ))}
    </div>
  );
}
