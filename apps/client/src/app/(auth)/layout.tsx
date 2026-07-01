import Link from "next/link";
import { Bus, ShieldCheck, Ticket, Wallet } from "lucide-react";
import { Logo } from "@cp/ui";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Form panel (left) */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">{children}</div>
      </div>
      {/* Brand panel (right) */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[linear-gradient(150deg,#17286fcc_0%,#0f2d5ccc_55%,#0b1d44cc_100%)] dark:[background:transparent] p-12 text-white lg:flex">
        <Link href="/" className="relative z-10 inline-flex w-fit rounded-xl px-3.5 py-2 shadow-sm"><Logo height={50} width={200}/></Link>
        <div className="relative z-10">
          <h2 className="font-display text-4xl font-bold leading-tight">Tout le réseau <br/>taxi-brousse,<br/> dans une seule appli.</h2>
          <ul className="mt-8 space-y-4 text-white/80">
            <li className="flex items-center gap-3"><ShieldCheck size={20} className="text-green" /> Sièges garantis, zéro double-réservation</li>
            <li className="flex items-center gap-3"><Wallet size={20} className="text-green" /> Mobile Money · Carte · Espèces</li>
            <li className="flex items-center gap-3"><Ticket size={20} className="text-green" /> Billet QR instantané</li>
            <li className="flex items-center gap-3"><Bus size={20} className="text-green" /> +47 coopératives, tout Madagascar</li>
          </ul>
        </div>
        <div className="pointer-events-none absolute -left-16 -top-16 h-72 w-72 rounded-full bg-orange/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 left-20 h-52 w-52 rounded-full bg-green/20 blur-3xl" />
        <p className="relative z-10 text-sm text-white/50">© 2026 Cooperative Plus</p>
      </div>
    </div>
  );
}
