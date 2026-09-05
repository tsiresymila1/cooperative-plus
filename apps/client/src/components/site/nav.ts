export type NavItem = { label: string; href: string; children?: NavItem[] };

export const NAV: NavItem[] = [
  { label: "Accueil", href: "/" },
  { label: "Trajets", href: "/search" },
  { label: "À propos", href: "/about" },
  { label: "FAQ", href: "/faq" },
  { label: "Devenir coopérative", href: "/coop/request" },
];
