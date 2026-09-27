"use client";
import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { db } from "../lib/db";
import { Button, Logo } from "./ui";
import { Field, Input } from "./form";
import { toast } from "./toast";

function PasswordField({
  label,
  hint,
  id,
  ...inputProps
}: Omit<React.ComponentProps<typeof Input>, "type"> & {
  label: string;
  hint?: string;
}) {
  const [visible, setVisible] = useState(false);
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div>
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      <div className="relative">
        <Input
          {...inputProps}
          id={inputId}
          type={visible ? "text" : "password"}
          className="pr-11"
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-lg text-ink-soft transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-laterite"
        >
          {visible ? <EyeOff aria-hidden size={18} /> : <Eye aria-hidden size={18} />}
        </button>
      </div>
      {hint ? <span className="mt-1 block text-xs text-ink-soft/70">{hint}</span> : null}
    </div>
  );
}

/**
 * Split-screen sign-in. Brand panel (left) + form (right).
 * Magic-code by default; pass `allowPassword` for email+password (coop/admin)
 * via the app's /api/auth/password route.
 */
export function SignInScreen({
  title = "Connexion",
  subtitle,
  allowPassword = false,
  allowMagicCode = true,
  allowPasswordReset = false,
  kicker = "Espace sécurisé",
  brandLines = ["Toute votre", "coopérative.", "Au même endroit."],
  brandSub = "Trajets, réservations, sièges et paiements — gérés en un seul espace, en temps réel.",
  features = ["Trajets", "Réservations", "Paiements"],
}: {
  title?: string;
  subtitle?: string;
  allowPassword?: boolean;
  allowMagicCode?: boolean;
  allowPasswordReset?: boolean;
  kicker?: string;
  brandLines?: string[];
  brandSub?: string;
  features?: string[];
}) {
  const [mode, setMode] = useState<"password" | "magic" | "reset">(allowPassword ? "password" : "magic");
  const [step, setStep] = useState<"email" | "code">("email");
  const [resetStep, setResetStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
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

  const sendPasswordResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/password/forgot", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Échec de l'envoi");
      setResetStep("code");
      toast.success("Si ce compte existe, un code lui a été envoyé");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de l'envoi");
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== passwordConfirmation) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/password/reset", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, code, password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Impossible de modifier le mot de passe");
      setMode("password");
      setResetStep("email");
      setCode("");
      setPassword("");
      setPasswordConfirmation("");
      toast.success("Mot de passe modifié. Vous pouvez vous connecter.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Impossible de modifier le mot de passe");
    } finally {
      setLoading(false);
    }
  };

  const sub = mode === "reset"
    ? resetStep === "email"
      ? "Recevez un code pour choisir un nouveau mot de passe."
      : `Saisissez le code envoyé à ${email}.`
    : subtitle ??
      (mode === "password"
      ? "Connectez-vous avec votre email et mot de passe."
      : step === "email" ? "Connectez-vous avec votre email." : `Code envoyé à ${email}.`);
  const heading = mode === "reset"
    ? resetStep === "email" ? "Mot de passe oublié" : "Nouveau mot de passe"
    : title;

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* ── Brand panel ─────────────────────────────────────── */}
      <aside
        className="relative hidden flex-col justify-between overflow-hidden bg-[#0b1d44] p-12 text-white lg:flex dark:border-r dark:border-r-ink/5"
      >
        {/* Brand photo backdrop + navy wash for legibility */}
        <span
          aria-hidden
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/brand-bg.jpg')" }}
        />
        <span
          aria-hidden
          className="absolute inset-0 [background:linear-gradient(150deg,rgba(15,45,92,.50)_0%,rgba(23,40,111,.50)_50%,rgba(11,29,68,.50)_70%)]"
        />
        {/* concentric rings */}
        {/* <svg
          aria-hidden
          className="pointer-events-none absolute -bottom-40 -left-40 h-[36rem] w-[36rem] opacity-[.12]"
          viewBox="0 0 400 400"
        >
          {[60, 110, 160, 200].map((r) => (
            <circle
              key={r}
              cx="200"
              cy="200"
              r={r}
              fill="none"
              stroke="white"
              strokeWidth="1.5"
            />
          ))}
        </svg> */}
        <Logo dark height={50} width={200} className="z-10" />

        <div className="relative">
          <h2 className="font-display text-[2.7rem] font-extrabold leading-[1.05] tracking-tight">
            {brandLines.map((l, i) => (
              <span
                key={i}
                className={
                  i === brandLines.length - 1 ? "block text-white/55" : "block"
                }
              >
                {l}
              </span>
            ))}
          </h2>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/70">
            {brandSub}
          </p>
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

      {/* ── Form panel — clean light surface (brand navy is the other side) ── */}
      <main className="relative grid place-items-center bg-paper px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-6 lg:hidden">
            <Logo height={80} />
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink-soft/55">
            {kicker}
          </p>
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-ink">
            {heading}
          </h1>
          <p className="mt-1.5 text-sm text-ink-soft">{sub}</p>

          {mode === "reset" ? (
            resetStep === "email" ? (
              <form onSubmit={sendPasswordResetCode} className="mt-7 space-y-4">
                <Field label="Email">
                  <Input
                    type="email"
                    autoFocus
                    autoComplete="email"
                    placeholder="vous@exemple.mg"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </Field>
                <Button className="w-full text-white" disabled={loading}>
                  {loading ? "Envoi…" : "Recevoir le code"}
                </Button>
                <button
                  type="button"
                  onClick={() => setMode("password")}
                  className="w-full text-center text-sm font-medium text-ink-soft hover:text-ink"
                >
                  ← Retour à la connexion
                </button>
              </form>
            ) : (
              <form onSubmit={changePassword} className="mt-7 space-y-4">
                <Field label="Code de vérification">
                  <Input
                    inputMode="numeric"
                    autoFocus
                    autoComplete="one-time-code"
                    placeholder="123456"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="text-center font-mono text-2xl tracking-[0.4em]"
                    required
                  />
                </Field>
                <PasswordField
                  label="Nouveau mot de passe"
                  hint="6 caractères minimum"
                  autoComplete="new-password"
                  minLength={6}
                  maxLength={128}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <PasswordField
                  label="Confirmer le mot de passe"
                  autoComplete="new-password"
                  minLength={6}
                  maxLength={128}
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  required
                />
                <Button className="w-full text-white" disabled={loading}>
                  {loading ? "Modification…" : "Modifier le mot de passe"}
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setResetStep("email");
                    setCode("");
                  }}
                  className="w-full text-center text-sm font-medium text-ink-soft hover:text-ink"
                >
                  ← Renvoyer un code
                </button>
              </form>
            )
          ) : mode === "password" ? (
            <form onSubmit={signInPassword} className="mt-7 space-y-4">
              <Field label="Email">
                <Input
                  type="email"
                  autoFocus
                  autoComplete="email"
                  placeholder="vous@exemple.mg"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Field>
              <PasswordField
                label="Mot de passe"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <Button className="w-full text-white" disabled={loading}>
                {loading ? "Connexion…" : "Se connecter"}
              </Button>
              {allowPasswordReset ? (
                <button
                  type="button"
                  onClick={() => {
                    setMode("reset");
                    setResetStep("email");
                    setCode("");
                    setPassword("");
                    setPasswordConfirmation("");
                  }}
                  className="w-full text-center text-sm font-medium text-laterite hover:text-laterite-deep"
                >
                  Mot de passe oublié ?
                </button>
              ) : null}
              {allowMagicCode ? (
                <button
                  type="button"
                  onClick={() => {
                    setMode("magic");
                    setStep("email");
                  }}
                  className="w-full text-center text-sm font-medium text-ink-soft hover:text-ink"
                >
                  Recevoir un code par email
                </button>
              ) : null}
            </form>
          ) : step === "email" ? (
            <form onSubmit={send} className="mt-7 space-y-4">
              <Field label="Email">
                <Input
                  type="email"
                  autoFocus
                  placeholder="vous@exemple.mg"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Field>
              <Button className="w-full text-white" disabled={loading}>
                {loading ? "Envoi…" : "Recevoir le code"}
              </Button>
              {allowPassword && (
                <button
                  type="button"
                  onClick={() => setMode("password")}
                  className="w-full text-center text-sm font-medium text-ink-soft hover:text-ink"
                >
                  ← Utiliser un mot de passe
                </button>
              )}
            </form>
          ) : (
            <form onSubmit={verify} className="mt-7 space-y-4">
              <Field label="Code de vérification">
                <Input
                  inputMode="numeric"
                  autoFocus
                  placeholder="123456"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="text-center font-mono text-2xl tracking-[0.4em]"
                  required
                />
              </Field>
              <Button className="w-full text-white" disabled={loading}>
                {loading ? "Vérification…" : "Se connecter"}
              </Button>
              <button
                type="button"
                onClick={() => setStep("email")}
                className="w-full text-center text-sm font-medium text-ink-soft hover:text-ink"
              >
                ← Changer d'email
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
