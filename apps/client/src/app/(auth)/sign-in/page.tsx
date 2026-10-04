"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { db, Field, Input, toast } from "@cp/ui";
import PageBanner from "@/components/site/PageBanner";
import {
  GoogleSignInButton,
  isGoogleSignInConfigured,
} from "@/components/auth/google-sign-in-button";

const GOLD_BTN =
  "h-[70px] bg-gold px-8 font-display text-[16px] font-semibold uppercase tracking-[0.5px] text-navy transition-colors duration-[250ms] hover:bg-navy hover:text-white disabled:opacity-60";

export default function SignInPage() {
  return <Suspense><SignIn /></Suspense>;
}

function SignIn() {
  const router = useRouter();
  const requestedNext = useSearchParams().get("next");
  const next =
    requestedNext?.startsWith("/") && !requestedNext.startsWith("//")
      ? requestedNext
      : "/account/dashboard";
  const { user } = db.useAuth();
  useEffect(() => {
    if (user && !(user as { isGuest?: boolean }).isGuest) router.replace(next);
  }, [user, next, router]);
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await db.auth.sendMagicCode({ email });
      toast.success("Code envoyé par email");
      setStep("code");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de l'envoi");
    } finally { setLoading(false); }
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await db.auth.signInWithMagicCode({ email, code });
      toast.success("Connecté");
      router.push(next);
    } catch {
      toast.error("Code invalide");
    } finally { setLoading(false); }
  };

  return (
    <main>
      <PageBanner title="Connexion" />
      <section className="py-[110px]">
        <div className="mx-auto max-w-shell px-[15px]">
          <h2 className="mb-[40px] font-display text-[48px] font-semibold uppercase text-navy lg:text-[60px]">
            Connexion
          </h2>

          {step === "email" ? (
            <div className="max-w-[640px]">
              {isGoogleSignInConfigured ? (
                <>
                  <GoogleSignInButton
                    onSignedIn={() => {
                      toast.success("Connecté avec Google");
                      router.replace(next);
                    }}
                  />
                  <div className="my-7 flex max-w-[320px] items-center gap-3 text-[12px] uppercase tracking-[0.14em] text-navy/45">
                    <span className="h-px flex-1 bg-navy/15" />
                    ou
                    <span className="h-px flex-1 bg-navy/15" />
                  </div>
                </>
              ) : null}
              <form onSubmit={sendCode}>
                <Field label="Adresse email *" variant="site" className="mb-6">
                  <Input
                    variant="site"
                    id="email"
                    name="email"
                    type="email"
                    autoFocus
                    placeholder="vous@exemple.mg"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </Field>
                <button type="submit" className={GOLD_BTN} disabled={loading}>
                  {loading ? "Envoi…" : "Recevoir le code"}
                </button>
              </form>
            </div>
          ) : (
            <form onSubmit={verify} className="max-w-[640px]">
              <Field label="Code de vérification *" variant="site" className="mb-6">
                <p className="mb-3 font-body text-[14px] text-navy/60">
                  Code à 6 chiffres envoyé à {email}.
                </p>
                <Input
                  variant="site"
                  id="code"
                  name="code"
                  inputMode="numeric"
                  autoFocus
                  placeholder="123456"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="font-mono tracking-[0.4em]"
                  required
                />
              </Field>
              <button type="submit" className={GOLD_BTN} disabled={loading}>
                {loading ? "Vérification…" : "Se connecter"}
              </button>
              <p className="mt-[30px]">
                <button
                  type="button"
                  onClick={() => setStep("email")}
                  className="font-body text-[14px] text-navy transition-colors duration-500 hover:text-gold"
                >
                  ← Changer d'email
                </button>
              </p>
            </form>
          )}

          <p className="mt-[30px]">
            Pas de compte ?{" "}
            <Link
              href="/sign-up"
              className="font-body text-[14px] text-navy transition-colors duration-500 hover:text-gold"
            >
              Créer un compte
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
