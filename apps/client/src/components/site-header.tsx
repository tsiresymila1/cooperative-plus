"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown, LogOut, Ticket, User } from "lucide-react";
import { Button, Logo, ThemeToggle, cn } from "@cp/ui";
import { db } from "@cp/ui";

function isReal(user: unknown): user is { id: string; email: string } {
  return !!user && !(user as { isGuest?: boolean }).isGuest;
}

/** `overlay` = transparent header floating over a hero image (white text). */
export function SiteHeader({ overlay = false }: { overlay?: boolean }) {
  const { isLoading, user } = db.useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const authed = isReal(user);

  const navLink = overlay ? "text-white/85 hover:text-white" : "text-ink-soft hover:text-ink";

  return (
    <header className={overlay
      ? "absolute inset-x-0 top-0 z-30"
      : "sticky top-0 z-30 border-b border-ink/8 bg-sand/80 backdrop-blur-xl"}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
        <Link href="/"><Logo dark={overlay} /></Link>
        <nav className={cn("hidden items-center gap-7 text-sm font-medium md:flex", navLink)}>
          <Link href="/search" className="transition-colors">Trajets</Link>
          {authed && <Link href="/account/bookings" className="transition-colors">Mes réservations</Link>}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle className={overlay ? "h-9 w-9 text-white/85 hover:bg-white/15 hover:text-white" : "h-9 w-9"} />
          {isLoading ? (
            <div className="h-9 w-24 animate-pulse rounded-[--radius] bg-ink/5" />
          ) : authed ? (
            <div className="relative">
              <button onClick={() => setOpen((o) => !o)} onBlur={() => setTimeout(() => setOpen(false), 150)}
                className={cn("flex items-center gap-2 rounded-full py-1 pl-1 pr-2.5 text-sm font-medium transition-colors",
                  overlay ? "border border-white/25 bg-white/10 text-white hover:bg-white/20" : "border border-ink/12 bg-paper hover:border-ink/25")}>
                <span className="grid h-7 w-7 place-items-center rounded-full bg-strong text-xs font-bold text-white">
                  {(user.email[0] ?? "U").toUpperCase()}
                </span>
                <ChevronDown size={14} className={overlay ? "text-white/70" : "text-ink-soft"} />
              </button>
              {open && (
                <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-[--radius] border border-ink/10 bg-paper shadow-[--shadow-lift]">
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
              <Link href="/sign-in" className={cn("hidden rounded-[--radius] px-3 py-2 text-sm font-medium transition-colors sm:inline-block", navLink)}>Connexion</Link>
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
