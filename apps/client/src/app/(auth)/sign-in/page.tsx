"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { db, toast } from "@cp/ui";
import PageBanner from "@/components/site/PageBanner";

const FIELD =
  "h-[53px] w-full border border-navy/15 bg-white px-5 font-body text-[16px] text-navy outline-none transition-colors duration-300 focus:border-gold";
const LABEL = "mb-2 block font-body text-[14px] text-navy";
const GOLD_BTN =
  "h-[70px] bg-gold px-8 font-display text-[16px] font-semibold uppercase tracking-[0.5px] text-navy transition-colors duration-[250ms] hover:bg-navy hover:text-white disabled:opacity-60";

export default function SignInPage() {
  return <Suspense><SignIn /></Suspense>;
}

function SignIn() {
  const router = useRouter();
  const next = useSearchParams().get("next") || "/account/dashboard";
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
            <form onSubmit={sendCode} className="max-w-[640px]">
              <div className="mb-6">
                <label htmlFor="email" className={LABEL}>
                  Adresse email <span className="text-sale">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoFocus
                  placeholder="vous@exemple.mg"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={FIELD}
                  required
                />
              </div>
              <button type="submit" className={GOLD_BTN} disabled={loading}>
                {loading ? "Envoi…" : "Recevoir le code"}
              </button>
            </form>
          ) : (
            <form onSubmit={verify} className="max-w-[640px]">
              <div className="mb-6">
                <label htmlFor="code" className={LABEL}>
                  Code de vérification <span className="text-sale">*</span>
                </label>
                <p className="mb-3 font-body text-[14px] text-navy/60">
                  Code à 6 chiffres envoyé à {email}.
                </p>
                <input
                  id="code"
                  name="code"
                  inputMode="numeric"
                  autoFocus
                  placeholder="123456"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className={`${FIELD} font-mono tracking-[0.4em]`}
                  required
                />
              </div>
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
