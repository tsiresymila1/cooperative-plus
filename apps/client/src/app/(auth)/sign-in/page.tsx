"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@cp/ui";
import { Field, Input } from "@cp/ui";
import { toast } from "@cp/ui";
import { db } from "@cp/ui";

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
      <h1 className="font-display text-3xl font-bold">{step === "email" ? "Bon retour" : "Entrez le code"}</h1>
      <p className="mt-1 text-ink-soft">
        {step === "email" ? "Connectez-vous avec votre email — pas de mot de passe." : `Code à 6 chiffres envoyé à ${email}.`}
      </p>

      {step === "email" ? (
        <form onSubmit={sendCode} className="mt-8 space-y-4">
          <Field label="Email"><Input type="email" autoFocus placeholder="vous@exemple.mg" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
          <Button className="w-full text-white" disabled={loading}>{loading ? "Envoi…" : "Recevoir le code"}</Button>
        </form>
      ) : (
        <form onSubmit={verify} className="mt-8 space-y-4">
          <Field label="Code de vérification">
            <Input inputMode="numeric" autoFocus placeholder="123456" maxLength={6} value={code}
              onChange={(e) => setCode(e.target.value)} className="text-center font-mono text-2xl tracking-[0.4em]" required />
          </Field>
          <Button className="w-full text-white" disabled={loading}>{loading ? "Vérification…" : "Se connecter"}</Button>
          <button type="button" onClick={() => setStep("email")} className="w-full text-center text-sm text-ink-soft hover:text-ink">← Changer d'email</button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-ink-soft">
        Pas de compte ? <Link href="/sign-up" className="font-semibold text-orange hover:underline">Créer un compte</Link>
      </p>
    </div>
  );
}
