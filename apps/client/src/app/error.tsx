"use client";
import { useEffect } from "react";
import Link from "next/link";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <main className="grid min-h-dvh place-items-center bg-white px-5 text-center">
      <div>
        <p className="font-display text-7xl font-bold uppercase text-sale">Oups</p>
        <h1 className="mt-3 font-display text-2xl font-bold uppercase">Une erreur est survenue</h1>
        <p className="mx-auto mt-2 max-w-sm text-navy/60">Quelque chose s&apos;est mal passé de notre côté. Réessayez.</p>
        <div className="mt-7 flex justify-center gap-3">
          <button onClick={reset} className="inline-flex h-11 items-center justify-center gap-2 bg-gold px-5 font-display uppercase tracking-wide text-navy transition-colors hover:bg-navy hover:text-white">
            Réessayer
          </button>
          <Link href="/" className="inline-flex h-11 items-center justify-center gap-2 border border-navy/20 px-5 font-display uppercase tracking-wide text-navy transition-colors hover:border-gold hover:text-gold">
            Accueil
          </Link>
        </div>
      </div>
    </main>
  );
}
