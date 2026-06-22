"use client";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

// Runs before paint (injected in layout <head>) to avoid a flash of wrong theme.
export const themeScript = `(function(){try{var t=localStorage.getItem('admin-theme');var d=t? t==='dark' : matchMedia('(prefers-color-scheme:dark)').matches;document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [dark, setDark] = useState(false);

  useEffect(() => setDark(document.documentElement.classList.contains("dark")), []);

  const toggle = () => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try { localStorage.setItem("admin-theme", next ? "dark" : "light"); } catch {}
    setDark(next);
  };

  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Passer en clair" : "Passer en sombre"}
      className={`grid h-9 w-9 place-items-center rounded-lg border border-ink/10 text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink ${className}`}
    >
      {dark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
