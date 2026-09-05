"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/* Searchable select dressed as the theme's booking field: 104px tall, white,
   Barlow Condensed 600 / 22px uppercase navy, with the 12px tracked label
   floating at the top. Square corners — the theme has no radius here. */

export default function FieldCombobox({
  name,
  label,
  placeholder,
  options,
  defaultValue = "",
  icon: Icon,
}: {
  name: string;
  label: string;
  placeholder: string;
  options: string[];
  defaultValue?: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(defaultValue);

  return (
    <div className="relative">
      {/* real value for the surrounding form */}
      <input type="hidden" name={name} value={value} />

      <div className="flex  items-center bg-red-100">
        {Icon ? (
          <Icon className="pointer-events-none absolute left-[20px] top-[27px] z-10 size-[18px] text-gold" />
        ) : null}
        <span
          className={`pointer-events-none absolute top-[25px] z-10 font-body text-[14px] font-bold text-black/40  ${
            Icon ? "left-[50px]" : "left-[20px]"
          }`}
        >
          {label}
        </span>
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            role="combobox"
            aria-expanded={open}
            aria-label={label}
            className="flex h-[104px] w-full items-end justify-between gap-2 rounded-none border-0 bg-white px-6 pb-[22px] text-left font-body text-[18px] font-normal text-navy outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            <span
              className={cn(
                "truncate text-[16px]",
                !value && "text-navy/40 text-[16px]",
              )}
            >
              {value || placeholder}
            </span>
            <ChevronDown
              className={cn(
                "size-5 shrink-0 text-navy/50 transition-transform duration-300",
                open && "rotate-180",
              )}
            />
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          className="w-[var(--radix-popover-trigger-width)] rounded-none border-navy/10 p-0"
        >
          <Command>
            <CommandInput placeholder={`Search…`} className="h-11" />
            <CommandList>
              <CommandEmpty>No result.</CommandEmpty>
              <CommandGroup>
                {options.map((opt) => (
                  <CommandItem
                    key={opt}
                    value={opt}
                    onSelect={(current) => {
                      setValue(current === value ? "" : current);
                      setOpen(false);
                    }}
                    className="rounded-none font-body text-[14px] text-navy data-[selected=true]:bg-mist"
                  >
                    <Check
                      className={cn(
                        "mr-2 size-4 text-gold",
                        value === opt ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {opt}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
