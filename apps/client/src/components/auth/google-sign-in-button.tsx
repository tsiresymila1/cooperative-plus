"use client";

import { useState } from "react";
import {
  GoogleLogin,
  GoogleOAuthProvider,
  type GoogleLoginProps,
} from "@react-oauth/google";
import { db, toast } from "@cp/ui";

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const instantGoogleClientName =
  process.env.NEXT_PUBLIC_INSTANT_GOOGLE_CLIENT_NAME ?? "google-web";

export const isGoogleSignInConfigured = Boolean(googleClientId);

export function GoogleSignInButton({
  onSignedIn,
  text = "continue_with",
}: {
  onSignedIn: () => void;
  text?: GoogleLoginProps["text"];
}) {
  if (!googleClientId) return null;

  return (
    <GoogleOAuthProvider clientId={googleClientId} locale="fr">
      <GoogleButton onSignedIn={onSignedIn} text={text} />
    </GoogleOAuthProvider>
  );
}

function GoogleButton({
  onSignedIn,
  text,
}: {
  onSignedIn: () => void;
  text: GoogleLoginProps["text"];
}) {
  const [nonce] = useState(() => globalThis.crypto.randomUUID());
  const [busy, setBusy] = useState(false);

  return (
    <div
      aria-busy={busy}
      className={busy ? "pointer-events-none opacity-60" : undefined}
    >
      <GoogleLogin
        logo_alignment="left"
        nonce={nonce}
        size="large"
        shape="rectangular"
        text={text}
        theme="outline"
        width="320"
        onError={() => toast.error("Échec de la connexion avec Google")}
        onSuccess={async ({ credential }) => {
          if (!credential) {
            toast.error("Google n’a pas retourné de jeton de connexion");
            return;
          }

          setBusy(true);
          try {
            await db.auth.signInWithIdToken({
              clientName: instantGoogleClientName,
              idToken: credential,
              nonce,
            });
            onSignedIn();
          } catch (error) {
            const message =
              error instanceof Error
                ? error.message
                : "Échec de la connexion avec Google";
            toast.error(message);
          } finally {
            setBusy(false);
          }
        }}
      />
    </div>
  );
}
