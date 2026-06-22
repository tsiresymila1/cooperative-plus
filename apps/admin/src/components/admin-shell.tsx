import Link from "next/link";
import { UserMenu, cn, type NavItem } from "@cp/ui";
import { ThemeToggle } from "./theme-toggle";

// Groups for the sidebar — items matched by href suffix.
const SECTIONS: { title: string; match: string[] }[] = [
  { title: "Plateforme", match: ["/admin/dashboard", "/admin/cooperatives"] },
  { title: "Gestion", match: ["/admin/plans", "/admin/destinations", "/admin/users"] },
];

/**
 * Admin shell — clean, minimal, light/dark aware. Drop-in replacement for the
 * shared DashboardShell (same props), used only by the admin app.
 */
export function AdminShell({
  nav,
  title,
  action,
  children,
  breadcrumb,
  eyebrow = "Plateforme",
}: {
  nav: NavItem[];
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  tenant?: string;
  logoUrl?: string | null;
  footer?: React.ReactNode;
  breadcrumb?: React.ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="flex min-h-dvh bg-sand">
      {/* ── Sidebar ───────────────────────────────────────────── */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-ink/8 bg-paper px-3 py-5 md:flex">
        <Link href="/admin/dashboard" className="flex items-center gap-2.5 px-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Cooperative Plus" className="h-8 w-8 rounded-lg object-contain" />
          <span className="font-display text-[17px] font-extrabold text-ink">
            Cooperative<span className="text-laterite">+</span>
          </span>
        </Link>

        <nav className="mt-6 flex flex-col gap-5">
          {SECTIONS.map((sec) => {
            const items = nav.filter((n) => sec.match.includes(n.href));
            if (!items.length) return null;
            return (
              <div key={sec.title}>
                <p className="eyebrow mb-1.5 px-3 text-[9.5px] text-ink-soft/45">{sec.title}</p>
                <div className="flex flex-col gap-0.5">
                  {items.map((n) => (
                    <Link
                      key={n.href}
                      href={n.href}
                      className={cn(
                        "group flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors",
                        n.active
                          ? "bg-laterite/10 text-laterite"
                          : "text-ink-soft hover:bg-ink/[.04] hover:text-ink",
                      )}
                    >
                      <span className={cn(n.active ? "text-laterite" : "text-ink-soft/60 group-hover:text-ink")}>
                        {n.icon}
                      </span>
                      {n.label}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="mt-auto px-3 text-[11px] text-ink-soft/45">Cooperative Plus · v1</div>
      </aside>

      {/* ── Main ──────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-ink/8 bg-sand/80 px-5 py-2.5 backdrop-blur-xl sm:px-6">
          <div className="flex min-w-0 items-center gap-1.5 truncate text-[13px] text-ink-soft/70">
            {breadcrumb ?? <span>Admin</span>}
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <UserMenu />
          </div>
        </header>

        <main className="flex-1 px-5 py-6 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div className="animate-rise">
              <p className="eyebrow text-[10px] text-ink-soft/50">{eyebrow}</p>
              <h1 className="mt-1 font-display text-[1.7rem] font-extrabold leading-none tracking-tight text-ink">
                {title}
              </h1>
            </div>
            {action && <div className="shrink-0">{action}</div>}
          </div>
          <div className="animate-rise" style={{ animationDelay: "50ms" }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
