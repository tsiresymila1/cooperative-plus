import { Bus, CalendarClock, LayoutDashboard, MapPin, Route, Settings, Ticket, Users, Wallet } from "lucide-react";
import type { NavItem } from "./dashboard-shell";

export function coopNav(slug: string, active: string): NavItem[] {
  const b = `/${slug}`;
  const items = [
    { key: "dashboard", href: `${b}/dashboard`, label: "Tableau de bord", icon: <LayoutDashboard size={18} /> },
    { key: "trips", href: `${b}/trips`, label: "Trajets", icon: <CalendarClock size={18} /> },
    { key: "bookings", href: `${b}/bookings`, label: "Réservations", icon: <Ticket size={18} /> },
    { key: "vehicles", href: `${b}/vehicles`, label: "Véhicules", icon: <Bus size={18} /> },
    { key: "routes", href: `${b}/routes`, label: "Itinéraires", icon: <Route size={18} /> },
    { key: "destinations", href: `${b}/destinations`, label: "Destinations", icon: <MapPin size={18} /> },
    { key: "payments", href: `${b}/payments`, label: "Paiements", icon: <Wallet size={18} /> },
    { key: "team", href: `${b}/team`, label: "Équipe", icon: <Users size={18} /> },
    { key: "settings", href: `${b}/settings`, label: "Paramètres", icon: <Settings size={18} /> },
  ];
  return items.map(({ key, ...rest }) => ({ ...rest, active: key === active }));
}
