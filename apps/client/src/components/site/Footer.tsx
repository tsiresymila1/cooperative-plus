import Link from "next/link";
import { Logo } from "@cp/ui";

const COLS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Voyager",
    links: [
      { label: "Rechercher un trajet", href: "/search" },
      { label: "Mes réservations", href: "/account/bookings" },
      { label: "Mon compte", href: "/account/dashboard" },
    ],
  },
  {
    title: "Coopératives",
    links: [{ label: "Rejoindre", href: "/coop/request" }],
  },
  {
    title: "Légal",
    links: [
      { label: "Confidentialité", href: "/privacy" },
      { label: "Conditions", href: "/terms" },
      { label: "Suppression de données", href: "/data-deletion" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-navy text-white">
      <div className="mx-auto max-w-shell px-[15px] py-[76px]">
        <div className="flex flex-col gap-8 border-b border-white/10 pb-10 lg:flex-row lg:items-center lg:justify-between">
          <Logo dark height={48} width={190} />
          <p className="max-w-md font-display text-[28px] font-semibold uppercase leading-[1.05] text-white">
            Réservez votre taxi-brousse en 2 minutes.
          </p>
        </div>

        <div className="grid gap-10 py-12 sm:grid-cols-3">
          {COLS.map((c) => (
            <div key={c.title}>
              <p className="font-display text-[22px] font-semibold uppercase text-gold">{c.title}</p>
              <ul className="mt-4 space-y-2.5">
                {c.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="inline-flex items-center gap-2 text-[14px] text-white/80 transition-colors duration-500 hover:text-gold">
                      <span className="inline-block size-[6px] rotate-45 bg-gold" /> {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-navy-deep">
        <div className="mx-auto flex max-w-shell items-center justify-between px-[15px] py-5 text-[13px] text-white/50">
          <span>© {new Date().getFullYear()} Coopérative Plus</span>
          <span>Madagascar · MGA</span>
        </div>
      </div>
    </footer>
  );
}
