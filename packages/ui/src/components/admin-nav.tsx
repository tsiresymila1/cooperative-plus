import { Building2, Globe, Inbox, LayoutDashboard, Receipt, Tag, Users } from "lucide-react";
import type { NavItem } from "./dashboard-shell";

export function adminNav(active: string): NavItem[] {
  const items = [
    { key: "dashboard", href: "/admin/dashboard", label: "Vue d'ensemble", icon: <LayoutDashboard size={18} /> },
    {
      key: "cooperatives",
      href: "/admin/cooperatives",
      label: "Coopératives",
      icon: <Building2 size={18} />,
      children: [
        { href: "/admin/cooperatives", label: "Toutes" },
        { href: "/admin/cooperatives/new", label: "Ajouter" },
      ],
    },
    { key: "requests", href: "/admin/requests", label: "Demandes", icon: <Inbox size={18} /> },
    { key: "plans", href: "/admin/plans", label: "Abonnements", icon: <Receipt size={18} /> },
    { key: "destinations", href: "/admin/destinations", label: "Destinations", icon: <Globe size={18} /> },
    { key: "tags", href: "/admin/tags", label: "Tags trajets", icon: <Tag size={18} /> },
    { key: "users", href: "/admin/users", label: "Utilisateurs", icon: <Users size={18} /> },
  ];
  return items.map(({ key, ...rest }) => ({ ...rest, active: key === active }));
}
