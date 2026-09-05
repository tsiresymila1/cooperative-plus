import Link from "next/link";
import { Logo } from "@cp/ui";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-white px-5 text-center">
      <div>
        <Link href="/" className="inline-block"><Logo height={44} width={180} /></Link>
        <p className="mt-10 font-mono text-7xl font-bold text-gold">404</p>
        <h1 className="mt-3 font-display text-2xl font-bold uppercase">Page introuvable</h1>
        <p className="mx-auto mt-2 max-w-sm text-navy/60">Cette page n&apos;existe pas ou a été déplacée.</p>
        <Link href="/" className="mt-7 inline-flex h-11 items-center justify-center gap-2 bg-gold px-5 font-display uppercase tracking-wide text-navy transition-colors hover:bg-navy hover:text-white">
          Retour à l&apos;accueil
        </Link>
      </div>
    </main>
  );
}
