"use client";
import { useState } from "react";
import { ChevronDown, LogOut, UserCog } from "lucide-react";
import { db } from "../lib/db";
import { useConfirm } from "./confirm";

export function UserMenu() {
  const { user } = db.useAuth();
  const confirm = useConfirm();
  const [open, setOpen] = useState(false);
  if (!user) return null;
  const initials = (user.email?.[0] ?? "U").toUpperCase();

  const logout = async () => {
    setOpen(false);
    if (await confirm({ title: "Se déconnecter ?", message: "Vous devrez vous reconnecter pour accéder à l'espace.", confirmLabel: "Déconnexion", tone: "danger" })) {
      await db.auth.signOut();
      window.location.href = "/";
    }
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="flex items-center gap-2 rounded-full border border-ink/12 bg-paper py-1 pl-1 pr-2.5 text-sm font-medium hover:border-ink/25">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-ink text-xs font-bold text-sand">{initials}</span>
        <ChevronDown size={14} className="text-ink-soft" />
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-[--radius] border border-ink/10 bg-paper shadow-[0_12px_32px_-12px_rgba(15,28,82,.25)]">
          <div className="border-b border-ink/8 px-4 py-3"><p className="truncate text-sm font-medium text-ink">{user.email}</p></div>
          <a href="/profile" className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-ink hover:bg-ink/5"><UserCog size={15} /> Mon compte</a>
          <button onMouseDown={(e) => { e.preventDefault(); logout(); }}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-laterite-deep hover:bg-ink/5"><LogOut size={15} /> Déconnexion</button>
        </div>
      )}
    </div>
  );
}
