"use client";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { db } from "../lib/db";
import { Button, Card, Logo, FormSection, FullSpinner } from "./ui";
import { Field, Input } from "./form";
import { toast } from "./toast";

/** Standalone account page (used by coop & admin at /profile). */
export function ProfilePage({ backHref = "/" }: { backHref?: string }) {
  const { isLoading, user } = db.useAuth();
  const { data } = db.useQuery(user ? { $users: { $: { where: { id: user.id } } } } : null);
  const me = data?.$users?.[0];
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (me) { setName((me.name as string) ?? ""); setPhone((me.phone as string) ?? ""); } }, [me?.id]);

  if (isLoading) return <FullSpinner />;
  if (!user) return <div className="grid min-h-dvh place-items-center text-ink-soft">Connexion requise.</div>;

  const save = async () => {
    setSaving(true);
    try { await db.transact(db.tx.$users[user.id].update({ name, phone })); toast.success("Profil mis à jour"); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Erreur"); } finally { setSaving(false); }
  };

  return (
    <div className="min-h-dvh bg-sand">
      <header className="border-b border-ink/10 bg-paper px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Logo />
          <a href={backHref}><Button variant="ghost" size="sm"><ArrowLeft size={15} /> Retour</Button></a>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-8">
        <h1 className="font-display text-2xl font-bold">Mon compte</h1>
        <FormSection index="01" title="Identité" description="Vos informations personnelles.">
          <div className="grid gap-4">
            <div className="flex items-center gap-3">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-strong text-lg font-bold text-white">{(name || user.email || "?").slice(0, 2).toUpperCase()}</span>
              <p className="text-sm text-ink-soft">{user.email}</p>
            </div>
            <Field label="Nom"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Votre nom" /></Field>
            <Field label="Téléphone"><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="034 00 000 00" /></Field>
            <Field label="Email"><Input value={user.email ?? ""} disabled className="opacity-60" /></Field>
            <div className="flex justify-end"><Button onClick={save} disabled={saving}>{saving ? "…" : "Enregistrer"}</Button></div>
          </div>
        </FormSection>
      </main>
    </div>
  );
}
