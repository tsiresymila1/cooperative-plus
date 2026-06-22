"use client";
import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "../lib/cn";

export const Select = SelectPrimitive.Root;
export const SelectGroup = SelectPrimitive.Group;
export const SelectValue = SelectPrimitive.Value;

export const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger ref={ref}
    className={cn("flex h-11 w-full items-center justify-between gap-2 rounded-[--radius] border border-ink/12 bg-paper px-3.5 text-[15px] text-ink outline-none transition-all data-[placeholder]:text-ink-soft/50 focus:border-orange focus:ring-2 focus:ring-orange/20 disabled:opacity-50 [&>span]:truncate", className)}
    {...props}>
    {children}
    <SelectPrimitive.Icon asChild><ChevronDown size={16} className="shrink-0 text-ink-soft/60" /></SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = "SelectTrigger";

export const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content ref={ref} position={position}
      className={cn("relative z-50 max-h-72 min-w-[8rem] overflow-hidden rounded-sm border border-ink/10 bg-paper shadow-[--shadow-lift] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
        position === "popper" && "data-[side=bottom]:translate-y-1", className)}
      {...props}>
      <SelectPrimitive.Viewport className={cn("p-1.5", position === "popper" && "w-[var(--radix-select-trigger-width)]")}>
        {children}
      </SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = "SelectContent";

export const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item ref={ref}
    className={cn("relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 pl-3 pr-8 text-sm text-ink outline-none transition-colors focus:bg-orange/10 focus:text-orange-deep data-[disabled]:opacity-50", className)}
    {...props}>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    <span className="absolute right-2 flex items-center"><SelectPrimitive.ItemIndicator><Check size={15} className="text-orange" /></SelectPrimitive.ItemIndicator></span>
  </SelectPrimitive.Item>
));
SelectItem.displayName = "SelectItem";
