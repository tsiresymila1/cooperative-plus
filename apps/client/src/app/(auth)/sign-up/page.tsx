"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { db, Field, Input, toast } from "@cp/ui";
import PageBanner from "@/components/site/PageBanner";
import {
  GoogleSignInButton,
  isGoogleSignInConfigured,
} from "@/components/auth/google-sign-in-button";

const GOLD_BTN =
  "h-[70px] bg-gold px-8 font-display text-[16px] font-semibold uppercase tracking-[0.5px] text-navy transition-colors duration-[250ms] hover:bg-navy hover:text-white disabled:opacity-60";

export default function SignUp() {
  const router = useRouter();
  const { user } = db.useAuth();
  useEffect(() => {
    if (user && !(user as { isGuest?: boolean }).isGuest) router.replace("/account/dashboard");
  }, [user, router]);
  const [step, setStep] = useState<"info" | "code">("info");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try { await db.auth.sendMagicCode({ email }); setStep("code"); toast.success("Code envoyé"); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Échec"); }
    finally { setLoading(false); }
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { user } = await db.auth.signInWithMagicCode({ email, code });
      const uid = user?.id;
      if (uid) await db.transact(db.tx.$users[uid]!.update({ name, phone, locale: "fr" }));
      toast.success("Compte créé · bienvenue");
      router.push("/account/dashboard");
    } catch { toast.error("Code invalide"); }
    finally { setLoading(false); }
  };

  return (
    <main>
      <PageBanner title="Créer un compte" />
      <section className="py-[110px]">
        <div className="mx-auto max-w-shell px-[15px]">
          <h2 className="mb-[40px] font-display text-[48px] font-semibold uppercase text-navy lg:text-[60px]">
            Créer un compte
          </h2>

          {step === "info" ? (
            <div className="max-w-[640px]">
              {isGoogleSignInConfigured ? (
                <>
                  <GoogleSignInButton
                    text="signup_with"
                    onSignedIn={() => {
                      toast.success("Compte Google connecté");
                      router.replace("/account/dashboard");
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
                <Field label="Nom complet *" variant="site" className="mb-6">
                  <Input
                    variant="site"
                    id="name"
                    name="name"
                    placeholder="Rakoto Hery"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </Field>
                <Field label="Téléphone" variant="site" className="mb-6">
                  <Input
                    variant="site"
                    id="phone"
                    name="phone"
                    inputMode="tel"
                    placeholder="034 00 000 00"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </Field>
                <Field label="Adresse email *" variant="site" className="mb-6">
                  <Input
                    variant="site"
                    id="email"
                    name="email"
                    type="email"
                    placeholder="vous@exemple.mg"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </Field>
                <button type="submit" className={GOLD_BTN} disabled={loading}>
                  {loading ? "Envoi…" : "Continuer"}
                </button>
              </form>
            </div>
          ) : (
            <form onSubmit={verify} className="max-w-[640px]">
              <Field label="Code de vérification *" variant="site" className="mb-6">
                <p className="mb-3 font-body text-[14px] text-navy/60">
                  Code envoyé à {email}.
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
                {loading ? "Vérification…" : "Créer mon compte"}
              </button>
              <p className="mt-[30px]">
                <button
                  type="button"
                  onClick={() => setStep("info")}
                  className="font-body text-[14px] text-navy transition-colors duration-500 hover:text-gold"
                >
                  ← Retour
                </button>
              </p>
            </form>
          )}

          <p className="mt-[30px]">
            Déjà inscrit ?{" "}
            <Link
              href="/sign-in"
              className="font-body text-[14px] text-navy transition-colors duration-500 hover:text-gold"
            >
              Se connecter
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
