"use client";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "../lib/cn";

/** Sun/moon theme toggle. Adds `.dark` on <html>, persists in localStorage. */
export function ThemeToggle({ className }: { className?: string }) {
  const [dark, setDark] = useState(false);
  useEffect(() => setDark(document.documentElement.classList.contains("dark")), []);

  const toggle = () => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try { localStorage.setItem("cp-theme", next ? "dark" : "light"); } catch { /* noop */ }
    setDark(next);
  };

  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Passer en clair" : "Passer en sombre"}
      title={dark ? "Thème clair" : "Thème sombre"}
      className={cn("grid h-10 w-10 place-items-center rounded-xl text-ink-soft transition-colors hover:bg-ink/[.05] hover:text-ink", className)}
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
