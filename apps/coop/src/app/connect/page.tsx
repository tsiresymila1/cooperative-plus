"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db, Logo, Button } from "@cp/ui";

function Handoff() {
  const router = useRouter();
  const sp = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = sp.get("token");
    const next = sp.get("next") || "/";
    if (!token) { router.replace(next); return; }
    let active = true;
    db.auth
      .signInWithToken(token)
      .then(() => { if (active) router.replace(next); })
      .catch((e) => { if (active) setError(e instanceof Error ? e.message : "Échec de la connexion."); });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="grid min-h-dvh place-items-center bg-sand px-5">
      <div className="flex flex-col items-center gap-4 text-center">
        <Logo className="justify-center" />
        {error ? (
          <>
            <p className="max-w-sm text-sm text-ink-soft">{error}</p>
            <a href="/"><Button size="sm" variant="outline">Aller à la connexion</Button></a>
          </>
        ) : (
          <p className="inline-flex items-center gap-2 text-sm text-ink-soft">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink/20 border-t-laterite" />
            Connexion en cours…
          </p>
        )}
      </div>
    </div>
  );
}

export default function ConnectPage() {
  return (
    <Suspense fallback={<div className="grid min-h-dvh place-items-center bg-sand text-ink-soft">…</div>}>
      <Handoff />
    </Suspense>
  );
}
