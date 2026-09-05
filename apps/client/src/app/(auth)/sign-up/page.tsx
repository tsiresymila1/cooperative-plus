"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { db, toast, Logo } from "@cp/ui";

const LABEL = "mb-2 block font-body text-[14px] text-white/70";
const FIELD =
  "h-[56px] w-full border border-white/15 bg-white px-5 font-body text-[16px] text-navy outline-none transition-colors duration-300 placeholder:text-navy/35 focus:border-gold";
const GOLD_BTN =
  "inline-flex h-[56px] w-full items-center justify-center bg-gold px-6 font-display text-[16px] font-semibold uppercase tracking-[0.5px] text-navy transition-colors duration-[250ms] hover:bg-white hover:text-navy disabled:opacity-60";

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
      <Link href="/" className="inline-flex"><Logo dark height={44} /></Link>

      <h1 className="mt-10 font-display text-[40px] font-semibold uppercase leading-none tracking-[-1px] text-white">
        {step === "info" ? "Créer un compte" : "Vérifiez votre email"}
      </h1>
      <p className="mt-3 font-body text-[15px] leading-[24px] text-white/60">
        {step === "info" ? "2 minutes pour réserver votre premier trajet." : `Code envoyé à ${email}.`}
      </p>

      {step === "info" ? (
        <form onSubmit={sendCode} className="mt-8 space-y-5">
          <label className="block">
            <span className={LABEL}>Nom complet</span>
            <input className={FIELD} placeholder="Rakoto Hery" value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label className="block">
            <span className={LABEL}>Téléphone</span>
            <input className={FIELD} inputMode="tel" placeholder="034 00 000 00" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>
          <label className="block">
            <span className={LABEL}>Email</span>
            <input className={FIELD} type="email" placeholder="vous@exemple.mg" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <button className={GOLD_BTN} disabled={loading}>{loading ? "Envoi…" : "Continuer"}</button>
        </form>
      ) : (
        <form onSubmit={verify} className="mt-8 space-y-5">
          <label className="block">
            <span className={LABEL}>Code de vérification</span>
            <input inputMode="numeric" autoFocus placeholder="123456" maxLength={6} value={code}
              onChange={(e) => setCode(e.target.value)} className={`${FIELD} text-center font-mono text-2xl tracking-[0.4em]`} required />
          </label>
          <button className={GOLD_BTN} disabled={loading}>{loading ? "Vérification…" : "Créer mon compte"}</button>
          <button type="button" onClick={() => setStep("info")} className="w-full text-center font-body text-[14px] text-white/60 transition-colors hover:text-gold">← Retour</button>
        </form>
      )}

      <p className="mt-8 text-center font-body text-[14px] text-white/60">
        Déjà inscrit ? <Link href="/sign-in" className="font-semibold text-gold hover:underline">Se connecter</Link>
      </p>
    </div>
  );
}
