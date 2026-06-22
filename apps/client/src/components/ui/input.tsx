"use client";
import * as React from "react";
import { cn } from "@cp/ui";

export const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, ...props }, ref) => (
    <input ref={ref}
      className={cn("h-11 w-full rounded-[--radius] border border-ink/12 bg-paper px-3.5 text-[15px] text-ink outline-none transition-all placeholder:text-ink-soft/40 focus:border-orange focus:ring-2 focus:ring-orange/20 disabled:opacity-50", className)}
      {...props} />
  ),
);
Input.displayName = "Input";
