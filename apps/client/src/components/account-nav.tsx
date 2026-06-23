"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CreditCard, LayoutGrid, LogOut, Ticket, User } from "lucide-react";
import { cn } from "@cp/ui";
import { db } from "@cp/ui";

const tabs = [
  { href: "/account/dashboard", label: "Accueil", icon: LayoutGrid },
  { href: "/account/bookings", label: "Réservations", icon: Ticket },
  { href: "/account/payments", label: "Paiements", icon: CreditCard },
  { href: "/account/profile", label: "Profil", icon: User },
];

export function AccountNav() {
  const path = usePathname();
  const router = useRouter();
  return (
    <div className="flex items-center gap-1 overflow-x-auto rounded-[--radius] border border-ink/8 bg-paper p-1">
      {tabs.map((t) => {
        const active = path === t.href;
        const Icon = t.icon;
        return (
          <Link key={t.href} href={t.href}
            className={cn("flex items-center gap-2 rounded-sm px-4 py-2 text-sm font-medium transition-colors",
              active ? "bg-strong text-white" : "text-ink-soft hover:bg-ink/5")}>
            <Icon size={16} /> {t.label}
          </Link>
        );
      })}
      <button onClick={async () => { await db.auth.signOut(); router.push("/"); }}
        className="ml-auto flex items-center gap-2 rounded-sm px-4 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-ink/5">
        <LogOut size={16} /> Déconnexion
      </button>
    </div>
  );
}
