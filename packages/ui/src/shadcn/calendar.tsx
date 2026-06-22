"use client";
import { DayPicker } from "react-day-picker";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../lib/cn";

export function Calendar({ className, classNames, showOutsideDays = true, ...props }: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-1", className)}
      classNames={{
        months: "flex flex-col",
        month: "space-y-3",
        month_caption: "relative flex h-9 items-center justify-center",
        caption_label: "text-sm font-semibold text-ink",
        nav: "absolute inset-x-0 flex items-center justify-between px-1",
        button_previous: "grid h-7 w-7 place-items-center rounded-md text-ink-soft transition-colors hover:bg-ink/5",
        button_next: "grid h-7 w-7 place-items-center rounded-md text-ink-soft transition-colors hover:bg-ink/5",
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "w-9 text-[11px] font-medium text-ink-soft/60",
        week: "mt-1 flex w-full",
        day: "h-9 w-9 p-0 text-center text-sm",
        day_button: "h-9 w-9 rounded-md text-ink transition-colors hover:bg-orange/10 aria-selected:bg-orange aria-selected:text-white aria-selected:hover:bg-orange",
        today: "font-bold text-orange",
        outside: "text-ink-soft/30",
        disabled: "opacity-40",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => orientation === "left" ? <ChevronLeft size={16} /> : <ChevronRight size={16} />,
      }}
      {...props}
    />
  );
}
