import Link from "next/link";
import { Logo } from "./ui";
import { UserMenu } from "./user-menu";
import { cn } from "../lib/cn";

export type NavItem = { href: string; label: string; icon: React.ReactNode; active?: boolean };

export function DashboardShell({ nav, title, action, children, tenant, logoUrl, footer, breadcrumb }: {
  nav: NavItem[]; title: string; action?: React.ReactNode; children: React.ReactNode;
  tenant?: string; logoUrl?: string | null; footer?: React.ReactNode; breadcrumb?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh bg-sand">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-ink/10 bg-paper px-4 py-6 md:flex">
        {/* Tenant identity: cooperative logo + name, fallback to Cooperative Plus */}
        <div className="flex items-center gap-2.5">
          <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl border border-ink/10 bg-sand">
            {logoUrl
              ? <img src={logoUrl} alt={tenant ?? "logo"} className="h-full w-full object-cover" />
              : <span className="font-display text-sm font-bold text-laterite">CP</span>}
          </div>
          <div className="min-w-0">
            <p className="truncate font-display text-base font-bold leading-tight text-ink">{tenant ?? "Cooperative Plus"}</p>
            <p className="text-[11px] font-medium text-ink-soft/60">Cooperative<span className="text-laterite">+</span></p>
          </div>
        </div>
        <nav className="mt-8 flex flex-col gap-1">
          {nav.map((n) => (
            <Link key={n.href} href={n.href}
              className={cn("flex items-center gap-3 rounded-[--radius] px-3 py-2.5 text-sm font-medium transition-colors",
                n.active ? "bg-laterite text-paper shadow-[0_8px_20px_-8px_rgba(37,99,235,.45)]" : "text-ink-soft hover:bg-ink/5 hover:text-ink")}>
              {n.icon}{n.label}
            </Link>
          ))}
        </nav>
        {footer && <div className="mt-auto">{footer}</div>}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* App bar: breadcrumb + connected user only (no page title/actions here) */}
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-ink/10 bg-sand/80 px-6 py-3 backdrop-blur-xl">
          <div className="flex items-center gap-1.5 text-xs font-medium text-ink-soft/60">{breadcrumb}</div>
          <UserMenu />
        </header>
        <main className="relative flex-1 overflow-hidden p-6">
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 [background-image:linear-gradient(rgba(22,38,107,.045)_1px,transparent_1px),linear-gradient(90deg,rgba(22,38,107,.045)_1px,transparent_1px)] [background-size:40px_40px] [mask-image:radial-gradient(ellipse_85%_55%_at_50%_0%,#000,transparent)]" />
          {/* Page header lives in the content, not the app bar */}
          <div className="mb-6 flex items-center justify-between gap-4">
            <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
            {action}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
