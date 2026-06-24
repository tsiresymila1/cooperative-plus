import Link from "next/link";
import { Button, Logo } from "@cp/ui";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-5 text-center">
      <div>
        <Link href="/" className="inline-block"><Logo height={44} width={180} /></Link>
        <p className="mt-10 font-mono text-7xl font-bold text-orange">404</p>
        <h1 className="mt-3 font-display text-2xl font-bold">Page introuvable</h1>
        <p className="mx-auto mt-2 max-w-sm text-ink-soft">Cette page n&apos;existe pas ou a été déplacée.</p>
        <Link href="/" className="mt-7 inline-block"><Button>Retour à l&apos;accueil</Button></Link>
      </div>
    </main>
  );
}
