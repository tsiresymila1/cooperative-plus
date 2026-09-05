"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { db, toast, Logo } from "@cp/ui";

const LABEL = "mb-2 block font-body text-[14px] text-white/70";
const FIELD =
  "h-[56px] w-full border border-white/15 bg-white px-5 font-body text-[16px] text-navy outline-none transition-colors duration-300 placeholder:text-navy/35 focus:border-gold";
const GOLD_BTN =
  "inline-flex h-[56px] w-full items-center justify-center bg-gold px-6 font-display text-[16px] font-semibold uppercase tracking-[0.5px] text-navy transition-colors duration-[250ms] hover:bg-white hover:text-navy disabled:opacity-60";

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
    <div>
      <Link href="/" className="inline-flex"><Logo dark height={44} /></Link>

      <h1 className="mt-10 font-display text-[40px] font-semibold uppercase leading-none tracking-[-1px] text-white">
        {step === "email" ? "Bon retour" : "Entrez le code"}
      </h1>
      <p className="mt-3 font-body text-[15px] leading-[24px] text-white/60">
        {step === "email" ? "Connectez-vous avec votre email — pas de mot de passe." : `Code à 6 chiffres envoyé à ${email}.`}
      </p>

      {step === "email" ? (
        <form onSubmit={sendCode} className="mt-8 space-y-5">
          <label className="block">
            <span className={LABEL}>Email</span>
            <input className={FIELD} type="email" autoFocus placeholder="vous@exemple.mg" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <button className={GOLD_BTN} disabled={loading}>{loading ? "Envoi…" : "Recevoir le code"}</button>
        </form>
      ) : (
        <form onSubmit={verify} className="mt-8 space-y-5">
          <label className="block">
            <span className={LABEL}>Code de vérification</span>
            <input inputMode="numeric" autoFocus placeholder="123456" maxLength={6} value={code}
              onChange={(e) => setCode(e.target.value)} className={`${FIELD} text-center font-mono text-2xl tracking-[0.4em]`} required />
          </label>
          <button className={GOLD_BTN} disabled={loading}>{loading ? "Vérification…" : "Se connecter"}</button>
          <button type="button" onClick={() => setStep("email")} className="w-full text-center font-body text-[14px] text-white/60 transition-colors hover:text-gold">← Changer d'email</button>
        </form>
      )}

      <p className="mt-8 text-center font-body text-[14px] text-white/60">
        Pas de compte ? <Link href="/sign-up" className="font-semibold text-gold hover:underline">Créer un compte</Link>
      </p>
    </div>
  );
}
