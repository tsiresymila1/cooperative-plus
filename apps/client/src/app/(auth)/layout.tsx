import Link from "next/link";
import { Bus, ShieldCheck, Ticket, Wallet } from "lucide-react";
import { Logo } from "@cp/ui";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-ink p-12 text-sand lg:flex">
        <Link href="/"><Logo dark /></Link>
        <div className="relative z-10">
          <h2 className="font-display text-4xl font-bold leading-tight">Tout le réseau taxi-brousse, dans une seule appli.</h2>
          <ul className="mt-8 space-y-4 text-sand/80">
            <li className="flex items-center gap-3"><ShieldCheck size={20} className="text-green" /> Sièges garantis, zéro double-réservation</li>
            <li className="flex items-center gap-3"><Wallet size={20} className="text-green" /> Mobile Money · Carte · Espèces</li>
            <li className="flex items-center gap-3"><Ticket size={20} className="text-green" /> Billet QR instantané</li>
            <li className="flex items-center gap-3"><Bus size={20} className="text-green" /> +47 coopératives, tout Madagascar</li>
          </ul>
        </div>
        <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-orange/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 right-20 h-52 w-52 rounded-full bg-green/20 blur-3xl" />
        <p className="relative z-10 text-sm text-sand/50">© 2026 Cooperative Plus</p>
      </div>
      {/* Form panel */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
