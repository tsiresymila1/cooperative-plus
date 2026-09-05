"use client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarDays } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Calendar } from "./calendar";
import { cn } from "@cp/ui";

export function DatePicker({ value, onChange, placeholder = "Choisir une date", className }: {
  value?: Date; onChange?: (d?: Date) => void; placeholder?: string; className?: string;
}) {
  return (
    <Popover>
      <PopoverTrigger
        className={cn("flex h-11 w-full items-center gap-2 rounded-[--radius] border border-navy/12 bg-white px-3.5 text-left text-[15px] outline-none transition-all focus:border-orange focus:ring-2 focus:ring-orange/20", className)}>
        <CalendarDays size={16} className="shrink-0 text-navy/60" />
        <span className={cn("truncate", value ? "text-navy" : "text-navy/50")}>
          {value ? format(value, "EEE d MMM yyyy", { locale: fr }) : placeholder}
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2">
        <Calendar mode="single" selected={value} onSelect={onChange} locale={fr} disabled={{ before: new Date("2026-06-19") }} />
      </PopoverContent>
    </Popover>
  );
}
