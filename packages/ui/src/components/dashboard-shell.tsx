"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, MoreHorizontal, Search, Bell, ShieldAlert } from "lucide-react";
import { CoopLogo } from "./ui";
import { useCoopOptional } from "./coop-guard";
import { UserMenu } from "./user-menu";
import { ThemeToggle } from "./theme";
import { SidebarProvider, useSidebar } from "./sidebar-context";
import { db } from "../lib/db";
import { cn } from "../lib/cn";

export type NavChild = { href: string; label: string; active?: boolean };
export type NavItem = { href: string; label: string; icon: React.ReactNode; active?: boolean; children?: NavChild[] };

type ShellProps = {
  nav: NavItem[]; title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode;
  tenant?: string; logoUrl?: string | null; footer?: React.ReactNode; breadcrumb?: React.ReactNode; kicker?: string;
};

/**
 * DashboardShell — the real TailAdmin shell (SidebarProvider + AppSidebar + AppHeader
 * + Backdrop + main content). Public API is unchanged; everything is wrapped in its own
 * SidebarProvider so pages keep calling <DashboardShell nav={…}>…</DashboardShell> as-is.
 */
export function DashboardShell(props: ShellProps) {
  return (
    <SidebarProvider>
      <ShellInner {...props} />
    </SidebarProvider>
  );
}

function ShellInner({ nav, title, subtitle, action, children, tenant, logoUrl, footer, breadcrumb, kicker }: ShellProps) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const suspended = useCoopOptional()?.coop?.subscriptionStatus === "suspended";

  // Dynamic left margin on the content column mirrors TailAdmin's (admin)/layout.tsx.
  const mainMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
    ? "lg:ml-[290px]"
    : "lg:ml-[90px]";

  return (
    <div className="min-h-dvh bg-sand xl:flex">
      <AppSidebar nav={nav} tenant={tenant} logoUrl={logoUrl} kicker={kicker} footer={footer} />
      <Backdrop />
      <div className={cn("flex min-w-0 flex-1 flex-col transition-all duration-300 ease-in-out", mainMargin)}>
        <AppHeader />
        <div className="mx-auto w-full max-w-[1536px] p-4 md:p-6">
          {suspended && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-danger">
              <ShieldAlert size={18} className="mt-0.5 shrink-0" />
              <p className="text-sm font-medium">Coopérative suspendue — accès administrateur uniquement. Le propriétaire et les assistants sont bloqués, et les trajets sont masqués côté voyageurs.</p>
            </div>
          )}
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-4">
            <div className="animate-rise">
              {breadcrumb && (
                <div className="mb-2 flex items-center gap-1.5 text-[12px] font-medium text-ink-soft/60">{breadcrumb}</div>
              )}
              <h1 className="font-display text-2xl font-semibold leading-tight tracking-tight text-ink">{title}</h1>
              {subtitle && <p className="mt-2 text-sm text-ink-soft">{subtitle}</p>}
            </div>
            {action && <div className="shrink-0">{action}</div>}
          </div>

          <div className="stagger-children">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Sidebar (port of TailAdmin AppSidebar) ─────────────────────────── */

function AppSidebar({ nav, tenant, logoUrl, kicker, footer }: {
  nav: NavItem[]; tenant?: string; logoUrl?: string | null; kicker?: string; footer?: React.ReactNode;
}) {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();

  // Settings pinned to the bottom of the sidebar; everything else in the main list.
  const isSettings = (n: NavItem) => n.href.endsWith("/settings");
  const main = nav.filter((n) => !isSettings(n));
  const bottom = nav.filter(isSettings);

  const showText = isExpanded || isHovered || isMobileOpen;
  const collapsed = !isExpanded && !isHovered;

  const isActive = useCallback((path: string) => path === pathname, [pathname]);

  // Accordion: which parent submenu is open, keyed by href, plus measured heights.
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Auto-open the parent whose item is active or whose child matches the path.
  useEffect(() => {
    let matched: string | null = null;
    for (const n of nav) {
      if (n.children && n.children.length > 0) {
        if (n.active || n.children.some((c) => c.active ?? isActive(c.href))) {
          matched = n.href;
          break;
        }
      }
    }
    setOpenSubmenu(matched);
  }, [nav, isActive]);

  useEffect(() => {
    if (openSubmenu && subMenuRefs.current[openSubmenu]) {
      setSubMenuHeight((prev) => ({
        ...prev,
        [openSubmenu]: subMenuRefs.current[openSubmenu]?.scrollHeight || 0,
      }));
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (href: string) => {
    setOpenSubmenu((prev) => (prev === href ? null : href));
  };

  const renderMenuItems = (items: NavItem[]) => (
    <ul className="flex flex-col gap-1">
      {items.map((n) => {
        const hasChildren = !!n.children && n.children.length > 0;
        const open = openSubmenu === n.href;
        return (
          <li key={n.href}>
            {hasChildren ? (
              <button
                onClick={() => handleSubmenuToggle(n.href)}
                className={cn(
                  "menu-item group cursor-pointer",
                  open || n.active ? "menu-item-active" : "menu-item-inactive",
                  collapsed ? "lg:justify-center" : "lg:justify-start",
                )}
              >
                <span className={cn(open || n.active ? "menu-item-icon-active" : "menu-item-icon-inactive")}>
                  {n.icon}
                </span>
                {showText && <span className="menu-item-text">{n.label}</span>}
                {showText && (
                  <ChevronDown
                    className={cn(
                      "ml-auto h-5 w-5 transition-transform duration-200",
                      open ? "rotate-180 text-laterite" : "",
                    )}
                  />
                )}
              </button>
            ) : (
              <Link
                href={n.href}
                className={cn(
                  "menu-item group",
                  n.active ? "menu-item-active" : "menu-item-inactive",
                  collapsed ? "lg:justify-center" : "lg:justify-start",
                )}
              >
                <span className={cn(n.active ? "menu-item-icon-active" : "menu-item-icon-inactive")}>
                  {n.icon}
                </span>
                {showText && <span className="menu-item-text">{n.label}</span>}
              </Link>
            )}

            {hasChildren && showText && (
              <div
                ref={(el) => {
                  subMenuRefs.current[n.href] = el;
                }}
                className="overflow-hidden transition-all duration-300"
                style={{ height: open ? `${subMenuHeight[n.href] ?? 0}px` : "0px" }}
              >
                <ul className="mt-1 ml-9 space-y-1">
                  {n.children!.map((c) => {
                    const active = c.active ?? isActive(c.href);
                    return (
                      <li key={c.href}>
                        <Link
                          href={c.href}
                          className={cn(
                            "menu-dropdown-item",
                            active ? "menu-dropdown-item-active" : "menu-dropdown-item-inactive",
                          )}
                        >
                          {c.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-line bg-paper px-5 text-ink transition-all duration-300 ease-in-out",
        showText ? "w-[290px]" : "w-[90px]",
        isMobileOpen ? "translate-x-0" : "-translate-x-full",
        "lg:translate-x-0",
      )}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo area */}
      <div className={cn("flex py-8", collapsed ? "lg:justify-center" : "justify-start")}>
        <Link href="/" className="flex items-center gap-3">
          <CoopLogo url={logoUrl} name={tenant} size={40} className="rounded-xl" />
          {showText && (
            <div className="min-w-0">
              <p className="truncate font-display text-[15px] font-extrabold leading-tight text-ink">{tenant ?? "Cooperative Plus"}</p>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-soft/55">{kicker ?? "Espace coopérative"}</p>
            </div>
          )}
        </Link>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto no-scrollbar duration-300 ease-linear">
        <nav className="mb-6">
          <div>
            <h2
              className={cn(
                "mb-4 flex text-xs uppercase leading-[20px] text-ink-soft/70",
                collapsed ? "lg:justify-center" : "justify-start",
              )}
            >
              {showText ? "Menu" : <MoreHorizontal className="h-5 w-5" />}
            </h2>
            {renderMenuItems(main)}
          </div>
        </nav>

        <div className="mt-auto flex flex-col gap-1 border-t border-line pt-3">
          {renderMenuItems(bottom)}
          {showText && footer}
          {showText && <SidebarUser tenant={tenant} />}
        </div>
      </div>
    </aside>
  );
}

/* ── Backdrop (port of TailAdmin Backdrop) ──────────────────────────── */

function Backdrop() {
  const { isMobileOpen, toggleMobileSidebar } = useSidebar();
  if (!isMobileOpen) return null;
  return <div className="fixed inset-0 z-40 bg-ink/50 lg:hidden" onClick={toggleMobileSidebar} />;
}

/* ── Header (port of TailAdmin AppHeader) ───────────────────────────── */

function AppHeader() {
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();

  const handleToggle = () => {
    if (typeof window !== "undefined" && window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  return (
    <header className="sticky top-0 z-30 flex w-full border-b border-line bg-paper">
      <div className="flex grow items-center justify-between gap-3 px-4 py-3 sm:gap-4 lg:px-6 lg:py-4">
        <div className="flex flex-1 items-center gap-3">
          <button
            onClick={handleToggle}
            aria-label="Toggle Sidebar"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-line text-ink-soft hover:bg-ink/5 lg:h-11 lg:w-11"
          >
            {isMobileOpen ? <CloseIcon /> : <HamburgerIcon />}
          </button>
          <TopSearch />
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <ThemeToggle />
          <NotifBell />
          <div className="mx-1 h-7 w-px bg-line" />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}

function HamburgerIcon() {
  return (
    <svg width="16" height="12" viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M0.583252 1C0.583252 0.585788 0.919038 0.25 1.33325 0.25H14.6666C15.0808 0.25 15.4166 0.585786 15.4166 1C15.4166 1.41421 15.0808 1.75 14.6666 1.75L1.33325 1.75C0.919038 1.75 0.583252 1.41422 0.583252 1ZM0.583252 11C0.583252 10.5858 0.919038 10.25 1.33325 10.25L14.6666 10.25C15.0808 10.25 15.4166 10.5858 15.4166 11C15.4166 11.4142 15.0808 11.75 14.6666 11.75L1.33325 11.75C0.919038 11.75 0.583252 11.4142 0.583252 11ZM1.33325 5.25C0.919038 5.25 0.583252 5.58579 0.583252 6C0.583252 6.41421 0.919038 6.75 1.33325 6.75L7.99992 6.75C8.41413 6.75 8.74992 6.41421 8.74992 6C8.74992 5.58579 8.41413 5.25 7.99992 5.25L1.33325 5.25Z" fill="currentColor" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z" fill="currentColor" />
    </svg>
  );
}

/** Derive the current cooperative slug from the path: /<slug>/... */
function useSlug() {
  const path = usePathname();
  return path?.split("/").filter(Boolean)[0] ?? "";
}

/** Global search box — submits to the bookings list with a query. ⌘K focuses it. */
function TopSearch() {
  const router = useRouter();
  const slug = useSlug();
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const base = slug === "admin" ? "/admin/cooperatives" : slug ? `/${slug}/bookings` : "";

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (base) router.push(`${base}?q=${encodeURIComponent(q.trim())}`); }}
      className="relative hidden w-full max-w-md lg:block"
    >
      <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft/50" />
      <input
        ref={inputRef}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Rechercher réservations, trajets, clients…"
        className="h-11 w-full rounded-lg border border-line bg-sand py-2.5 pl-10 pr-14 text-sm text-ink shadow-theme-xs placeholder:text-ink-soft/50 transition-all focus:border-laterite focus:bg-paper focus:outline-none focus:ring-3 focus:ring-laterite/10"
      />
      <span className="absolute right-2.5 top-1/2 inline-flex -translate-y-1/2 items-center gap-0.5 rounded-lg border border-line bg-sand-deep px-[7px] py-[4.5px] text-xs -tracking-[0.2px] text-ink-soft/70">
        <span>⌘</span>
        <span>K</span>
      </span>
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

/** Footer chip in the sidebar — avatar + email, links to profile. */
function SidebarUser({ tenant }: { tenant?: string }) {
  const { user } = db.useAuth();
  const initials = (user?.email?.[0] ?? "U").toUpperCase();
  return (
    <Link
      href="/profile"
      className="mt-1 flex items-center gap-2.5 rounded-xl border border-line bg-sand px-2.5 py-2 transition-colors hover:bg-ink/[.04]"
    >
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-strong text-xs font-bold text-white">{initials}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12.5px] font-semibold text-ink">{user?.email ?? "Mon compte"}</span>
        <span className="block truncate text-[10.5px] text-ink-soft/60">{tenant ?? "Coopérative"}</span>
      </span>
      <ChevronRight size={14} className="text-ink-soft/40" />
    </Link>
  );
}
