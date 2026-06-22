"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown, LogOut, Ticket, User } from "lucide-react";
import { Button, Logo } from "@cp/ui";
import { db } from "@cp/ui";

function isReal(user: unknown): user is { id: string; email: string } {
  return !!user && !(user as { isGuest?: boolean }).isGuest;
}

export function SiteHeader() {
  const { isLoading, user } = db.useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const authed = isReal(user);

  return (
    <header className="sticky top-0 z-30 border-b border-ink/8 bg-[#fcfbf9]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
        <Link href="/logo"><Logo /></Link>
        <nav className="hidden items-center gap-7 text-sm font-medium text-ink-soft md:flex">
          <Link href="/search" className="hover:text-ink">Trajets</Link>
          {authed && <Link href="/account/bookings" className="hover:text-ink">Mes réservations</Link>}
        </nav>

        <div className="flex items-center gap-2">
          {isLoading ? (
            <div className="h-9 w-24 animate-pulse rounded-[--radius] bg-ink/5" />
          ) : authed ? (
            <div className="relative">
              <button onClick={() => setOpen((o) => !o)} onBlur={() => setTimeout(() => setOpen(false), 150)}
                className="flex items-center gap-2 rounded-full border border-ink/12 bg-white py-1 pl-1 pr-2.5 text-sm font-medium hover:border-ink/25">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-ink text-xs font-bold text-sand">
                  {(user.email[0] ?? "U").toUpperCase()}
                </span>
                <ChevronDown size={14} className="text-ink-soft" />
              </button>
              {open && (
                <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-[--radius] border border-ink/10 bg-white shadow-[--shadow-lift]">
                  <div className="border-b border-ink/8 px-4 py-3">
                    <p className="truncate text-sm font-medium">{user.email}</p>
                  </div>
                  <Item href="/account/dashboard" icon={<User size={15} />} label="Mon compte" />
                  <Item href="/account/bookings" icon={<Ticket size={15} />} label="Mes réservations" />
                  <button onClick={async () => { await db.auth.signOut(); router.push("/"); }}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-danger hover:bg-ink/5">
                    <LogOut size={15} /> Déconnexion
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/sign-in"><Button variant="ghost" size="sm">Connexion</Button></Link>
              <Link href="/sign-up"><Button size="sm">Créer un compte</Button></Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function Item({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink hover:bg-ink/5">{icon} {label}</Link>
  );
}
