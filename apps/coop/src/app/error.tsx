"use client";
import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@cp/ui";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <main className="grid min-h-dvh place-items-center px-5 text-center">
      <div>
        <p className="font-display text-7xl font-bold text-danger">Oups</p>
        <h1 className="mt-3 font-display text-2xl font-bold">Une erreur est survenue</h1>
        <p className="mx-auto mt-2 max-w-sm text-ink-soft">Quelque chose s&apos;est mal passé. Réessayez.</p>
        <div className="mt-7 flex justify-center gap-3">
          <Button onClick={reset}>Réessayer</Button>
          <Link href="/"><Button variant="outline">Accueil</Button></Link>
        </div>
      </div>
    </main>
  );
}
