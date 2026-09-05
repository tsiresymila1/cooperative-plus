"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, ChevronRight, User, LogOut, Ticket } from "lucide-react";
import { Logo, db, useConfirm } from "@cp/ui";
import { NAV } from "./nav";

function isReal(u: unknown): u is { id: string; email: string } {
  return !!u && !(u as { isGuest?: boolean }).isGuest;
}

/* Tourix-style header: fixed, transparent over the home hero, navy once
   scrolled; white navbar on inner routes. Adapted to Coopérative Plus nav +
   magic-code auth (no cart). */
export default function Header() {
  const [open, setOpen] = useState(false);
  const [stuck, setStuck] = useState(false);
  const [menu, setMenu] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const confirm = useConfirm();
  const { user } = db.useAuth();
  const authed = isReal(user);

  const overlay = pathname === "/";
  // Header ground is dark whenever it overlays the hero (transparent) or is the
  // navy stuck bar — both need white ink. Only inner white pages use navy ink.
  const onDark = overlay;

  useEffect(() => { document.body.style.overflow = open ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [open]);
  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 100);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const linkColor = onDark ? "text-white" : "text-navy";

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 h-[100px] transition-colors duration-300 ease-out ${
        overlay
          ? stuck
            ? "bg-navy shadow-[0_6px_24px_rgba(20,49,76,0.18)]"
            : "bg-transparent"
          : "bg-white/[0.99] shadow-[0_2px_18px_rgba(20,49,76,0.08)]"
      }`}
    >
      <div className="mx-auto flex h-[100px] max-w-shell items-center justify-between px-[15px]">
        <Link href="/" aria-label="Coopérative Plus" className="shrink-0 transition-opacity duration-500 hover:opacity-80">
          <Logo dark={onDark} height={44} width={180} />
        </Link>

        <nav className="hidden lg:block">
          <ul className="flex items-center gap-x-[10px]">
            {NAV.map((item) => (
              <li key={item.label} className="relative">
                <Link
                  href={item.href}
                  aria-current={pathname === item.href ? "page" : undefined}
                  className={`relative flex h-[26px] items-center px-5 text-[14px] font-medium transition-colors duration-[400ms] ease-out hover:text-gold-nav ${linkColor}`}
                >
                  {item.label}
                  {pathname === item.href ? (
                    <span aria-hidden className="absolute inset-x-5 bottom-0 h-px animate-[navUnderline_500ms_ease_forwards] bg-gold-nav" />
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-x-[18px]">
          {authed ? (
            <div className="relative">
              <button
                onClick={() => setMenu((v) => !v)}
                onBlur={() => setTimeout(() => setMenu(false), 150)}
                className={`flex items-center gap-2 transition-colors duration-500 hover:text-gold-hover ${linkColor}`}
                aria-label="Mon compte"
              >
                <span className="grid size-8 place-items-center rounded-full bg-gold text-[13px] font-bold text-navy">
                  {(user!.email[0] ?? "U").toUpperCase()}
                </span>
              </button>
              {menu ? (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white py-2 shadow-[0_10px_30px_rgba(20,49,76,0.14)]">
                  <div className="border-b border-navy/10 px-4 py-2.5">
                    <p className="truncate text-[13px] font-medium text-navy">{user!.email}</p>
                  </div>
                  <Link href="/account/dashboard" className="flex items-center gap-2.5 px-4 py-2.5 text-[14px] text-navy hover:bg-gold hover:text-navy"><User className="size-4" /> Mon compte</Link>
                  <Link href="/account/bookings" className="flex items-center gap-2.5 px-4 py-2.5 text-[14px] text-navy hover:bg-gold hover:text-navy"><Ticket className="size-4" /> Mes réservations</Link>
                  <button
                    onClick={async () => { if (!(await confirm({ title: "Se déconnecter ?", message: "Vous devrez vous reconnecter.", confirmLabel: "Déconnexion", tone: "danger" }))) return; await db.auth.signOut(); router.push("/"); }}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[14px] text-sale hover:bg-navy/5"
                  ><LogOut className="size-4" /> Déconnexion</button>
                </div>
              ) : null}
            </div>
          ) : (
            <Link href="/sign-in" aria-label="Connexion" className={`hidden items-center gap-1.5 text-[14px] font-medium transition-colors duration-500 hover:text-gold-hover sm:flex ${linkColor}`}>
              <User className="size-[18px]" strokeWidth={1.5} /> Connexion
            </Link>
          )}

          <Link href="/search" className="hidden h-[44px] items-center bg-gold px-5 font-display text-[15px] font-semibold uppercase tracking-[0.5px] text-navy transition-colors duration-[250ms] hover:bg-navy hover:text-white sm:inline-flex">
            Réserver
          </Link>

          <button type="button" onClick={() => setOpen(true)} aria-label="Menu" className={`transition-colors duration-300 hover:text-gold lg:hidden ${linkColor}`}>
            <Menu className="size-6" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button type="button" aria-label="Fermer" onClick={() => setOpen(false)} className="absolute inset-0 bg-navy/70" />
          <div className="absolute right-0 top-0 h-full w-[300px] max-w-[85vw] overflow-y-auto bg-white p-6">
            <button type="button" onClick={() => setOpen(false)} aria-label="Fermer" className="mb-6 text-navy transition-colors hover:text-gold"><X className="size-6" strokeWidth={1.5} /></button>
            <ul className="space-y-1">
              {NAV.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} onClick={() => setOpen(false)} className="flex items-center justify-between py-2.5 text-[15px] font-medium text-navy transition-colors hover:text-gold">
                    {item.label} <ChevronRight className="size-4 text-navy/40" />
                  </Link>
                </li>
              ))}
              <li className="pt-3">
                {authed
                  ? <Link href="/account/dashboard" onClick={() => setOpen(false)} className="block bg-gold px-4 py-3 text-center font-display font-semibold uppercase text-navy">Mon compte</Link>
                  : <Link href="/sign-in" onClick={() => setOpen(false)} className="block bg-gold px-4 py-3 text-center font-display font-semibold uppercase text-navy">Connexion</Link>}
              </li>
            </ul>
          </div>
        </div>
      ) : null}
    </header>
  );
}
