"use client";
import { useState } from "react";
import { db } from "../lib/db";
import { Button, Logo } from "./ui";
import { Field, Input } from "./form";
import { toast } from "./toast";

/**
 * Split-screen sign-in. Brand panel (left) + form (right).
 * Magic-code by default; pass `allowPassword` for email+password (coop/admin)
 * via the app's /api/auth/password route.
 */
export function SignInScreen({
  title = "Connexion",
  subtitle,
  allowPassword = false,
  kicker = "Espace sécurisé",
  brandLines = ["Toute votre", "coopérative.", "Au même endroit."],
  brandSub = "Trajets, réservations, sièges et paiements — gérés en un seul espace, en temps réel.",
  features = ["Trajets", "Réservations", "Paiements"],
}: {
  title?: string;
  subtitle?: string;
  allowPassword?: boolean;
  kicker?: string;
  brandLines?: string[];
  brandSub?: string;
  features?: string[];
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
      await db.auth.signInWithToken(json.token);
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
    try { await db.auth.signInWithMagicCode({ email, code }); }
    catch { toast.error("Code invalide"); setLoading(false); }
  };

  const sub = subtitle ??
    (mode === "password"
      ? "Connectez-vous avec votre email et mot de passe."
      : step === "email" ? "Connectez-vous avec votre email." : `Code envoyé à ${email}.`);

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* ── Brand panel ─────────────────────────────────────── */}
      <aside className="relative hidden flex-col justify-between overflow-hidden p-12 text-white lg:flex
        [background:linear-gradient(150deg,#17286f_0%,#0f2d5c_55%,#0b1d44_100%)] dark:[background:transparent] dark:border-r dark:border-r-ink/5">
        {/* concentric rings */}
        <svg aria-hidden className="pointer-events-none absolute -bottom-40 -left-40 h-[36rem] w-[36rem] opacity-[.12]" viewBox="0 0 400 400">
          {[60, 110, 160, 200].map((r) => <circle key={r} cx="200" cy="200" r={r} fill="none" stroke="white" strokeWidth="1.5" />)}
        </svg>
        <Logo dark height={50} width={200} />

        <div className="relative">
          <h2 className="font-display text-[2.7rem] font-extrabold leading-[1.05] tracking-tight">
            {brandLines.map((l, i) => (
              <span key={i} className={i === brandLines.length - 1 ? "block text-white/55" : "block"}>{l}</span>
            ))}
          </h2>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/70">{brandSub}</p>
        </div>

        <div className="relative flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">
          {features.map((f, i) => (
            <span key={f} className="flex items-center gap-3">
              {i > 0 && <span className="h-px w-6 bg-white/20" />}
              {f}
            </span>
          ))}
        </div>
      </aside>

      {/* ── Form panel ──────────────────────────────────────── */}
      <main
        className="relative grid place-items-center bg-sand px-6 py-12"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(15,45,92,.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,45,92,.045) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
        }}
      >
        <div className="w-full max-w-sm">
          <div className="mb-6 lg:hidden"><Logo /></div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink-soft/55">{kicker}</p>
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-ink">{title}</h1>
          <p className="mt-1.5 text-sm text-ink-soft">{sub}</p>

          {mode === "password" ? (
            <form onSubmit={signInPassword} className="mt-7 space-y-4">
              <Field label="Email"><Input type="email" autoFocus placeholder="vous@exemple.mg" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
              <Field label="Mot de passe"><Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required /></Field>
              <Button className="w-full text-white" disabled={loading}>{loading ? "Connexion…" : "Se connecter"}</Button>
              <button type="button" onClick={() => { setMode("magic"); setStep("email"); }} className="w-full text-center text-sm font-medium text-ink-soft hover:text-ink">Recevoir un code par email</button>
            </form>
          ) : step === "email" ? (
            <form onSubmit={send} className="mt-7 space-y-4">
              <Field label="Email"><Input type="email" autoFocus placeholder="vous@exemple.mg" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
              <Button className="w-full text-white" disabled={loading}>{loading ? "Envoi…" : "Recevoir le code"}</Button>
              {allowPassword && (
                <button type="button" onClick={() => setMode("password")} className="w-full text-center text-sm font-medium text-ink-soft hover:text-ink">← Utiliser un mot de passe</button>
              )}
            </form>
          ) : (
            <form onSubmit={verify} className="mt-7 space-y-4">
              <Field label="Code de vérification">
                <Input inputMode="numeric" autoFocus placeholder="123456" maxLength={6} value={code}
                  onChange={(e) => setCode(e.target.value)} className="text-center font-mono text-2xl tracking-[0.4em]" required />
              </Field>
              <Button className="w-full text-white" disabled={loading}>{loading ? "Vérification…" : "Se connecter"}</Button>
              <button type="button" onClick={() => setStep("email")} className="w-full text-center text-sm font-medium text-ink-soft hover:text-ink">← Changer d'email</button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
