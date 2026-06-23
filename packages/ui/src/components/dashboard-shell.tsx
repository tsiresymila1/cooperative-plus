"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronRight, Search, Bell } from "lucide-react";
import { CoopLogo } from "./ui";
import { UserMenu } from "./user-menu";
import { db } from "../lib/db";
import { cn } from "../lib/cn";

export type NavChild = { href: string; label: string; active?: boolean };
export type NavItem = { href: string; label: string; icon: React.ReactNode; active?: boolean; children?: NavChild[] };

export function DashboardShell({ nav, title, subtitle, action, children, tenant, logoUrl, footer, breadcrumb, kicker }: {
  nav: NavItem[]; title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode;
  tenant?: string; logoUrl?: string | null; footer?: React.ReactNode; breadcrumb?: React.ReactNode; kicker?: string;
}) {
  // Settings pinned to the bottom of the sidebar; everything else in the main list.
  const isSettings = (n: NavItem) => n.href.endsWith("/settings");
  const main = nav.filter((n) => !isSettings(n));
  const bottom = nav.filter(isSettings);

  return (
    <div className="flex min-h-dvh bg-sand">
      {/* ── Sidebar ───────────────────────────────────────────── */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-ink/8 bg-paper px-3.5 py-5 md:flex">
        <div className="flex items-center gap-3 px-2">
          <CoopLogo url={logoUrl} name={tenant} size={40} className="rounded-xl" />
          <div className="min-w-0">
            <p className="truncate font-display text-[15px] font-extrabold leading-tight text-ink">{tenant ?? "Cooperative Plus"}</p>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-soft/55">{kicker ?? "Espace coopérative"}</p>
          </div>
        </div>

        <nav className="mt-7 flex flex-1 flex-col gap-1 overflow-y-auto">
          {main.map((n) => (
            <NavLink key={n.href} item={n} />
          ))}
        </nav>

        <div className="mt-3 flex flex-col gap-1 border-t border-ink/8 pt-3">
          {bottom.map((n) => (
            <NavLink key={n.href} item={n} />
          ))}
          {footer}
          <SidebarUser tenant={tenant} />
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-ink/8 bg-paper/80 px-6 backdrop-blur-xl">
          <TopSearch />
          <div className="flex shrink-0 items-center gap-2">
            <NotifBell />
            <div className="mx-1 h-7 w-px bg-ink/10" />
            <UserMenu />
          </div>
        </header>

        <main
          className="relative flex-1 px-6 py-7 lg:px-8"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(15,45,92,.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,45,92,.04) 1px, transparent 1px)",
            backgroundSize: "26px 26px",
            backgroundAttachment: "fixed",
          }}
        >
          <div className="mb-6 flex items-end justify-between gap-4">
            <div className="animate-rise">
              {breadcrumb && (
                <div className="mb-2 flex items-center gap-1.5 text-[12px] font-medium text-ink-soft/60">{breadcrumb}</div>
              )}
              <h1 className="font-display text-[1.85rem] font-extrabold leading-none tracking-tight text-ink">{title}</h1>
              {subtitle && <p className="mt-2 text-sm text-ink-soft">{subtitle}</p>}
            </div>
            {action && <div className="shrink-0">{action}</div>}
          </div>
          <div className="stagger-children">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

/** Derive the current cooperative slug from the path: /<slug>/... */
function useSlug() {
  const path = usePathname();
  return path?.split("/").filter(Boolean)[0] ?? "";
}

/** Global search box — submits to the bookings list with a query. */
function TopSearch() {
  const router = useRouter();
  const slug = useSlug();
  const [q, setQ] = useState("");
  const base = slug === "admin" ? "/admin/cooperatives" : slug ? `/${slug}/bookings` : "";
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (base) router.push(`${base}?q=${encodeURIComponent(q.trim())}`); }}
      className="relative w-full max-w-md"
    >
      <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft/50" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Rechercher réservations, trajets, clients…"
        className="h-10 w-full rounded-xl border border-transparent bg-sand py-2 pl-10 pr-4 text-sm text-ink placeholder:text-ink-soft/50 transition-all focus:border-ink/15 focus:bg-paper focus:outline-none focus:ring-2 focus:ring-ink/[.06]"
      />
    </form>
  );
}

/** Notification affordance — links to the bookings list. */
function NotifBell() {
  const slug = useSlug();
  const href = slug === "admin" ? "/admin/cooperatives" : `/${slug}/bookings`;
  return (
    <Link href={href} title="Notifications"
      className="relative grid h-10 w-10 place-items-center rounded-xl text-ink-soft transition-colors hover:bg-ink/[.05] hover:text-ink">
      <Bell size={18} />
      <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-laterite ring-2 ring-paper" />
    </Link>
  );
}

function NavLink({ item: n }: { item: NavItem }) {
  return (
    <div>
      <Link
        href={n.href}
        className={cn(
          "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold transition-all",
          n.active
            ? "bg-laterite text-white"
            : "text-ink-soft hover:bg-ink/[.04] hover:text-ink",
        )}
      >
        <span className={cn("transition-colors", n.active ? "text-white" : "text-ink-soft/60 group-hover:text-ink")}>
          {n.icon}
        </span>
        {n.label}
      </Link>
      {n.active && n.children && n.children.length > 0 && (
        <div className="relative ml-[1.5rem] mt-0.5 flex flex-col gap-0.5 border-l border-ink/10 pl-3">
          {n.children.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className={cn(
                "rounded-md px-2.5 py-1.5 text-[12.5px] transition-colors",
                c.active ? "font-semibold text-laterite" : "text-ink-soft/70 hover:text-ink",
              )}
            >
              {c.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/** Footer chip in the sidebar — avatar + email, links to profile. */
function SidebarUser({ tenant }: { tenant?: string }) {
  const { user } = db.useAuth();
  const initials = (user?.email?.[0] ?? "U").toUpperCase();
  return (
    <Link
      href="/profile"
      className="mt-1 flex items-center gap-2.5 rounded-xl border border-ink/8 bg-sand/60 px-2.5 py-2 transition-colors hover:bg-ink/[.04]"
    >
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-ink text-xs font-bold text-white">{initials}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12.5px] font-semibold text-ink">{user?.email ?? "Mon compte"}</span>
        <span className="block truncate text-[10.5px] text-ink-soft/60">{tenant ?? "Coopérative"}</span>
      </span>
      <ChevronRight size={14} className="text-ink-soft/40" />
    </Link>
  );
}
