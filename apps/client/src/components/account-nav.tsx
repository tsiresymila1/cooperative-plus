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
    <div className="flex items-stretch gap-x-8 overflow-x-auto border-b border-navy/10 bg-white">
      {tabs.map((t) => {
        const active = path === t.href;
        const Icon = t.icon;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 border-b-2 py-4 font-display text-[16px] font-semibold uppercase tracking-[0.5px] transition-colors duration-300",
              active
                ? "border-gold text-navy"
                : "border-transparent text-navy/50 hover:text-navy",
            )}
          >
            <Icon size={17} strokeWidth={2} /> {t.label}
          </Link>
        );
      })}
      <button
        onClick={async () => {
          await db.auth.signOut();
          router.push("/");
        }}
        className="ml-auto inline-flex shrink-0 items-center gap-2 border-b-2 border-transparent py-4 font-display text-[16px] font-semibold uppercase tracking-[0.5px] text-navy/50 transition-colors duration-300 hover:text-sale"
      >
        <LogOut size={17} strokeWidth={2} /> Déconnexion
      </button>
    </div>
  );
}
