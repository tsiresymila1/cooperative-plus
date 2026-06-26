"use client";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";
import { db } from "../lib/db";
import { isValidPhone } from "../lib/phone";
import { Button, Card, Logo, FormSection, FullSpinner } from "./ui";
import { Field, Input } from "./form";
import { toast } from "./toast";

const schema = z.object({
  name: z.string().trim().min(1, "Nom requis"),
  phone: z.string().trim().min(1, "Téléphone requis").refine(isValidPhone, "Numéro de téléphone invalide"),
});
type Values = z.infer<typeof schema>;

/** Standalone account page (used by coop & admin at /profile). */
export function ProfilePage({ backHref = "/" }: { backHref?: string }) {
  const { isLoading, user } = db.useAuth();
  const { data } = db.useQuery(user ? { $users: { $: { where: { id: user.id } } } } : null);
  const me = data?.$users?.[0];
  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: { name: "", phone: "" },
  });
  const name = watch("name");
  useEffect(() => { if (me) reset({ name: (me.name as string) ?? "", phone: (me.phone as string) ?? "" }); }, [me?.id]);

  if (isLoading) return <FullSpinner />;
  if (!user) return <div className="grid min-h-dvh place-items-center text-ink-soft">Connexion requise.</div>;

  const save = handleSubmit(async (v) => {
    try { await db.transact(db.tx.$users[user.id].update({ name: v.name, phone: v.phone })); toast.success("Profil mis à jour"); }
    catch (e) { toast.error("Erreur: " + (e instanceof Error ? e.message : "inconnue")); }
  });

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
            <Field label="Nom" error={errors.name?.message}><Input {...register("name")} placeholder="Votre nom" /></Field>
            <Field label="Téléphone" error={errors.phone?.message}><Input {...register("phone")} placeholder="034 00 000 00" /></Field>
            <Field label="Email"><Input value={user.email ?? ""} disabled className="opacity-60" /></Field>
            <div className="flex justify-end"><Button onClick={save} disabled={isSubmitting}>{isSubmitting ? "…" : "Enregistrer"}</Button></div>
          </div>
        </FormSection>
      </main>
    </div>
  );
}
