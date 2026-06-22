import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const fmtMoney = (minor: number, currency = "MGA") =>
  new Intl.NumberFormat("fr-MG", { style: "currency", currency, maximumFractionDigits: 0 }).format(minor);
