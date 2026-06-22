"use client";
import { useState } from "react";
import { db } from "../lib/db";
import { Button, Card, Logo } from "./ui";
import { Field, Input } from "./form";
import { toast } from "./toast";

/**
 * Sign-in screen. Magic-code by default; pass `allowPassword` to enable
 * email+password (coop owners) via the app's /api/auth/password route.
 */
export function SignInScreen({
  title = "Connexion",
  subtitle,
  allowPassword = false,
}: {
  title?: string;
  subtitle?: string;
  allowPassword?: boolean;
}) {
  const [mode, setMode] = useState<"password" | "magic">(allowPassword ? "password" : "magic");
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const signInPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Échec de la connexion");
      await db.auth.signInWithToken(json.token); // guard re-renders on auth change
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de la connexion");
      setLoading(false);
    }
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try { await db.auth.sendMagicCode({ email }); setStep("code"); toast.success("Code envoyé par email"); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Échec de l'envoi"); }
    finally { setLoading(false); }
  };
  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try { await db.auth.signInWithMagicCode({ email, code }); /* guard re-renders on auth change */ }
    catch { toast.error("Code invalide"); setLoading(false); }
  };

  const sub = subtitle ??
    (mode === "password"
      ? "Connectez-vous avec votre email et mot de passe."
      : step === "email" ? "Connectez-vous avec votre email." : `Code envoyé à ${email}.`);

  return (
    <div className="grid min-h-dvh place-items-center bg-sand px-5">
      <Card className="w-full max-w-sm p-8">
        <Logo className="justify-center" />
        <h1 className="mt-6 text-center font-display text-2xl font-bold">{title}</h1>
        <p className="mt-1 text-center text-sm text-ink-soft">{sub}</p>

        {mode === "password" ? (
          <form onSubmit={signInPassword} className="mt-6 space-y-4">
            <Field label="Email"><Input type="email" autoFocus placeholder="vous@exemple.mg" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
            <Field label="Mot de passe"><Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required /></Field>
            <Button className="w-full" disabled={loading}>{loading ? "Connexion…" : "Se connecter"}</Button>
            <button type="button" onClick={() => { setMode("magic"); setStep("email"); }} className="w-full text-center text-sm text-ink-soft hover:text-ink">Recevoir un code par email</button>
          </form>
        ) : step === "email" ? (
          <form onSubmit={send} className="mt-6 space-y-4">
            <Field label="Email"><Input type="email" autoFocus placeholder="vous@exemple.mg" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
            <Button className="w-full" disabled={loading}>{loading ? "Envoi…" : "Recevoir le code"}</Button>
            {allowPassword && (
              <button type="button" onClick={() => setMode("password")} className="w-full text-center text-sm text-ink-soft hover:text-ink">← Utiliser un mot de passe</button>
            )}
          </form>
        ) : (
          <form onSubmit={verify} className="mt-6 space-y-4">
            <Field label="Code de vérification">
              <Input inputMode="numeric" autoFocus placeholder="123456" maxLength={6} value={code}
                onChange={(e) => setCode(e.target.value)} className="text-center font-mono text-2xl tracking-[0.4em]" required />
            </Field>
            <Button className="w-full" disabled={loading}>{loading ? "Vérification…" : "Se connecter"}</Button>
            <button type="button" onClick={() => setStep("email")} className="w-full text-center text-sm text-ink-soft hover:text-ink">← Changer d'email</button>
          </form>
        )}
      </Card>
    </div>
  );
}
