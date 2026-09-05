import Link from "next/link";
import { Bus, ShieldCheck, Ticket, Wallet } from "lucide-react";
import { Logo } from "@cp/ui";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Branded panel (left) — navy with gold accents */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-navy p-8 text-white lg:flex lg:p-12">
        <Link href="/" className="relative z-10 inline-flex w-fit"><Logo dark height={50} width={200} /></Link>
        <div className="relative z-10">
          <h2 className="font-display text-4xl font-bold uppercase leading-tight">Tout le réseau <br />taxi-brousse,<br /> dans une seule appli.</h2>
          <ul className="mt-8 space-y-4 text-white/70">
            <li className="flex items-center gap-3"><ShieldCheck size={20} className="text-gold" /> Sièges garantis, zéro double-réservation</li>
            <li className="flex items-center gap-3"><Wallet size={20} className="text-gold" /> Mobile Money · Carte · Espèces</li>
            <li className="flex items-center gap-3"><Ticket size={20} className="text-gold" /> Billet QR instantané</li>
            <li className="flex items-center gap-3"><Bus size={20} className="text-gold" /> +47 coopératives, tout Madagascar</li>
          </ul>
        </div>
        <p className="relative z-10 text-sm text-white/50">© 2026 Cooperative Plus</p>
        <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-gold/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 right-20 h-52 w-52 rounded-full bg-gold/10 blur-3xl" />
      </div>
      {/* Form panel (right) — white */}
      <div className="flex flex-col justify-center bg-white p-8 lg:p-12">
        <div className="mx-auto w-full max-w-sm py-10">
          <Link href="/" className="mb-8 inline-flex lg:hidden"><Logo height={44} width={180} /></Link>
          {children}
        </div>
      </div>
    </div>
  );
}
