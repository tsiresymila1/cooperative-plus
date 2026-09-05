"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CalendarDays } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/* Same field shell as FieldCombobox so the four booking controls line up.
   Submits an ISO date in a hidden input; the trigger shows the theme's
   uppercase display face. */

export default function FieldDatePicker({
  name,
  label,
  placeholder = "Departure",
}: {
  name: string;
  label: string;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>();

  return (
    <div className="relative">
      <input
        type="hidden"
        name={name}
        value={date ? format(date, "yyyy-MM-dd") : ""}
      />

      <CalendarDays className="pointer-events-none absolute left-[20px] top-[27px] z-10 size-[13px] text-gold" />
      <span className="pointer-events-none absolute left-[40px] top-[25px] z-10 font-body text-[14px] font-light text-black/40">
        {label}
      </span>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={label}
            className="flex h-[104px] w-full items-end justify-between gap-2 rounded-none border-0 bg-white px-6 pb-[22px] text-left font-body text-[18px] font-normal text-navy outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            <span className={cn("truncate", !date && "text-navy/40")}>
              {date ? format(date, "dd MMM yyyy") : placeholder}
            </span>
            <CalendarDays className="size-5 shrink-0 text-navy/50" />
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          className="w-auto rounded-none border-navy/10 p-0"
        >
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => {
              setDate(d);
              setOpen(false);
            }}
            disabled={{ before: new Date() }}
            autoFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
