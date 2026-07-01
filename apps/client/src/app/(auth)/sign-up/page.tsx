"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@cp/ui";
import { Field, Input } from "@cp/ui";
import { toast } from "@cp/ui";
import { db } from "@cp/ui";

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
    <div>
      <h1 className="font-display text-3xl font-bold">{step === "info" ? "Créer un compte" : "Vérifiez votre email"}</h1>
      <p className="mt-1 text-ink-soft">{step === "info" ? "2 minutes pour réserver votre premier trajet." : `Code envoyé à ${email}.`}</p>

      {step === "info" ? (
        <form onSubmit={sendCode} className="mt-8 space-y-4">
          <Field label="Nom complet"><Input placeholder="Rakoto Hery" value={name} onChange={(e) => setName(e.target.value)} required /></Field>
          <Field label="Téléphone"><Input inputMode="tel" placeholder="034 00 000 00" value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
          <Field label="Email"><Input type="email" placeholder="vous@exemple.mg" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
          <Button className="w-full text-white" disabled={loading}>{loading ? "Envoi…" : "Continuer"}</Button>
        </form>
      ) : (
        <form onSubmit={verify} className="mt-8 space-y-4">
          <Field label="Code de vérification">
            <Input inputMode="numeric" autoFocus placeholder="123456" maxLength={6} value={code}
              onChange={(e) => setCode(e.target.value)} className="text-center font-mono text-2xl tracking-[0.4em]" required />
          </Field>
          <Button className="w-full" disabled={loading}>{loading ? "Vérification…" : "Créer mon compte"}</Button>
          <button type="button" onClick={() => setStep("info")} className="w-full text-center text-sm text-ink-soft hover:text-ink">← Retour</button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-ink-soft">
        Déjà inscrit ? <Link href="/sign-in" className="font-semibold text-orange hover:underline">Se connecter</Link>
      </p>
    </div>
  );
}
