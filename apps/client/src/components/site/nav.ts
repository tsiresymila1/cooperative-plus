export type NavItem = { label: string; href: string; children?: NavItem[] };

export const NAV: NavItem[] = [
  { label: "Accueil", href: "/" },
  { label: "Trajets", href: "/search" },
  { label: "Devenir coopérative", href: "/coop/request" },
  { label: "Aide", href: "/data-deletion" },
];
