import { Bus, CalendarClock, CarFront, CreditCard, IdCard, LayoutDashboard, MapPin, QrCode, Route, Settings, Tag, Ticket, Users, UserRound, BarChart3, Wallet } from "lucide-react";
import type { NavItem } from "./dashboard-shell";

type Access = { role?: string; permissions?: string[]; isPlatformAdmin?: boolean };

// Which membership permission each nav item requires (null = always visible).
const NAV_PERM: Record<string, string | null> = {
  dashboard: null,
  bookings: "bookings",
  scan: "bookings",
  trips: "trips",
  vehicles: "vehicles",
  models: "models",
  drivers: "drivers",
  routes: "routes",
  destinations: "routes",
  tags: "trips",
  customers: "bookings",
  payments: "payments",
  reports: "payments",
  team: "team",
  abonnement: "settings",
  settings: "settings",
};

export function coopNav(slug: string, active: string, access?: Access): NavItem[] {
  const b = `/${slug}`;
  const items = [
    { key: "dashboard", href: `${b}/dashboard`, label: "Tableau de bord", icon: <LayoutDashboard size={18} /> },
    { key: "bookings", href: `${b}/bookings`, label: "Réservations", icon: <Ticket size={18} /> },
    { key: "scan", href: `${b}/scan`, label: "Embarquement", icon: <QrCode size={18} /> },
    { key: "trips", href: `${b}/trips`, label: "Trajets", icon: <CalendarClock size={18} /> },
    { key: "vehicles", href: `${b}/vehicles`, label: "Véhicules", icon: <Bus size={18} /> },
    { key: "models", href: `${b}/models`, label: "Modèles", icon: <CarFront size={18} /> },
    { key: "drivers", href: `${b}/drivers`, label: "Chauffeurs", icon: <IdCard size={18} /> },
    { key: "routes", href: `${b}/routes`, label: "Itinéraires", icon: <Route size={18} /> },
    { key: "destinations", href: `${b}/destinations`, label: "Destinations", icon: <MapPin size={18} /> },
    { key: "tags", href: `${b}/tags`, label: "Tags trajets", icon: <Tag size={18} /> },
    { key: "customers", href: `${b}/customers`, label: "Clients", icon: <UserRound size={18} /> },
    { key: "payments", href: `${b}/payments`, label: "Paiements", icon: <Wallet size={18} /> },
    { key: "reports", href: `${b}/reports`, label: "Rapports", icon: <BarChart3 size={18} /> },
    { key: "team", href: `${b}/team`, label: "Équipe", icon: <Users size={18} /> },
    { key: "abonnement", href: `${b}/abonnement`, label: "Abonnement", icon: <CreditCard size={18} /> },
    { key: "settings", href: `${b}/settings`, label: "Paramètres", icon: <Settings size={18} /> },
  ];
  // Owners + platform admins see everything; assistants are filtered by permission.
  const full = !access || access.isPlatformAdmin || access.role !== "assistant";
  const allow = new Set(access?.permissions ?? []);
  return items
    .filter((it) => full || NAV_PERM[it.key] === null || allow.has(NAV_PERM[it.key]!))
    .map(({ key, ...rest }) => ({ ...rest, active: key === active }));
}

/** True when the current member may access a section (owner/admin = always). */
export function coopCan(access: Access | undefined, perm: string): boolean {
  if (!access || access.isPlatformAdmin || access.role !== "assistant") return true;
  return (access.permissions ?? []).includes(perm);
}
