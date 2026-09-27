"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="fr">
      <body>
        <main
          style={{ display: "grid", minHeight: "100vh", placeItems: "center", padding: 24, textAlign: "center" }}
        >
          <div>
            <h1>Une erreur est survenue</h1>
            <p>Le problème a été signalé. Vous pouvez réessayer.</p>
            <button type="button" onClick={reset}>
              Réessayer
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
