"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { DashboardShell, type NavItem } from "@cp/ui";

const CRUMB_LABELS: Record<string, string> = {
  dashboard: "Vue d'ensemble",
  cooperatives: "Coopératives",
  plans: "Abonnements",
  destinations: "Destinations",
  users: "Utilisateurs",
  new: "Ajouter",
  edit: "Modifier",
  profile: "Mon compte",
};

function AutoCrumb({ path }: { path: string }) {
  const segs = path.split("/").filter(Boolean).filter((s) => s !== "admin");
  const crumbs = segs.map((s, i) => {
    const href = "/admin/" + segs.slice(0, i + 1).join("/");
    const label = CRUMB_LABELS[s] ?? (/^[0-9a-f-]{12,}$/i.test(s) ? "Détail" : s);
    return { href, label, last: i === segs.length - 1 };
  });
  return (
    <>
      <Link href="/admin/dashboard" className="flex items-center gap-1 text-ink-soft/60 hover:text-ink"><Home size={13} /></Link>
      {crumbs.map((c) => (
        <span key={c.href} className="flex items-center gap-1.5">
          <ChevronRight size={12} className="text-ink-soft/35" />
          {c.last ? <span className="font-semibold text-ink">{c.label}</span> : <Link href={c.href} className="hover:text-ink">{c.label}</Link>}
        </span>
      ))}
    </>
  );
}

/**
 * Admin shell — now identical to the coop DashboardShell (white sidebar,
 * orange active pills, grid-paper canvas, search app bar). Thin wrapper so the
 * admin pages keep their `AdminShell` API + auto breadcrumbs.
 */
export function AdminShell({
  nav, title, subtitle, action, children, breadcrumb,
}: {
  nav: NavItem[];
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  tenant?: string;
  logoUrl?: string | null;
  footer?: React.ReactNode;
  breadcrumb?: React.ReactNode;
  eyebrow?: string;
}) {
  const path = usePathname();
  return (
    <DashboardShell
      nav={nav}
      title={title}
      subtitle={subtitle}
      action={action}
      tenant="Administration"
      kicker="Console plateforme"
      breadcrumb={breadcrumb ?? <AutoCrumb path={path} />}
      logoUrl={'/logo-round.png'}
    >
      {children}
    </DashboardShell>
  );
}
