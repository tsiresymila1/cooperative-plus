"use client";
import { Clock } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "./select";
import { cn } from "../lib/cn";

const pad = (n: number) => String(n).padStart(2, "0");
const HOURS = Array.from({ length: 24 }, (_, i) => pad(i));
const MINUTES = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];

/** Time picker = two dropdowns (hour + minute). Value/onChange are "HH:MM". */
export function TimePicker({ value, onChange, className }: {
  value?: string; onChange?: (v: string) => void; placeholder?: string; className?: string;
}) {
  const [h, m] = (value ?? "").split(":");
  const set = (nh: string, nm: string) => onChange?.(`${nh}:${nm}`);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Select value={h || ""} onValueChange={(nh) => set(nh, m || "00")}>
        <SelectTrigger className="h-11 flex-1">
          <span className="inline-flex items-center gap-2">
            <Clock size={16} className="shrink-0 text-ink-soft/60" />
            <SelectValue placeholder="Heure" />
          </span>
        </SelectTrigger>
        <SelectContent className="max-h-60">
          {HOURS.map((x) => <SelectItem key={x} value={x}>{x} h</SelectItem>)}
        </SelectContent>
      </Select>

      <span className="font-mono text-ink-soft/50">:</span>

      <Select value={m || ""} onValueChange={(nm) => set(h || "00", nm)}>
        <SelectTrigger className="h-11 flex-1">
          <SelectValue placeholder="Min" />
        </SelectTrigger>
        <SelectContent className="max-h-60">
          {MINUTES.map((x) => <SelectItem key={x} value={x}>{x} min</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
