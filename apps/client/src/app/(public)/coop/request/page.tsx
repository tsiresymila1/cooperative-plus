"use client";
import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Building2, ArrowRight } from "lucide-react";
import { db, id, toast } from "@cp/ui";
import PageBanner from "@/components/site/PageBanner";

const empty = { displayName: "", legalName: "", region: "", contactName: "", email: "", phone: "", address: "", message: "" };

const FIELD =
  "h-[60px] w-full border border-navy/15 bg-white px-5 font-body text-[16px] text-navy outline-none transition-colors duration-300 placeholder:text-navy/35 focus:border-gold";
const LABEL = "mb-2 block font-body text-[14px] text-navy";
const GOLD_BTN =
  "inline-flex h-[60px] items-center justify-center gap-2 bg-gold px-8 font-display text-[16px] font-semibold uppercase tracking-[0.5px] text-navy transition-colors duration-[250ms] hover:bg-navy hover:text-white disabled:opacity-60";

export default function CoopRequest() {
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.displayName.trim() || !form.contactName.trim() || !form.email.trim() || !form.phone.trim()) {
      toast.error("Nom de la coopérative, contact, email et téléphone sont requis.");
      return;
    }
    setSaving(true);
    try {
      await db.transact(
        db.tx.coopRequests[id()].update({
          displayName: form.displayName.trim(),
          legalName: form.legalName.trim() || undefined,
          region: form.region.trim() || undefined,
          contactName: form.contactName.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
          address: form.address.trim() || undefined,
          message: form.message.trim() || undefined,
          status: "pending",
          createdAt: Date.now(),
        }),
      );
      setDone(true);
    } catch (e: any) {
      toast.error(e?.message ?? "Échec de l'envoi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main>
      <PageBanner title="Inscrire votre coopérative" />

      <section className="py-[100px]">
        <div className="mx-auto max-w-narrow px-[15px]">
          {done ? (
            <div className="mx-auto flex max-w-[640px] flex-col items-center gap-4 border border-navy/10 bg-white p-12 text-center">
              <span className="grid h-16 w-16 place-items-center rounded-full bg-gold/15 text-gold"><CheckCircle2 size={36} /></span>
              <h1 className="font-display text-[36px] font-semibold uppercase leading-none tracking-[-1px] text-navy">Demande envoyée</h1>
              <p className="max-w-md font-body text-[16px] leading-[26px] text-navy/70">
                Notre équipe examine votre demande. Vous serez contacté à <span className="font-semibold text-navy">{form.email}</span> dès validation, avec vos accès à l&apos;espace coopérative.
              </p>
              <Link href="/" className="mt-2 inline-flex h-[56px] items-center justify-center border border-navy/20 px-7 font-display text-[15px] font-semibold uppercase tracking-[0.5px] text-navy transition-colors duration-[250ms] hover:border-gold hover:text-gold">
                Retour à l&apos;accueil
              </Link>
            </div>
          ) : (
            <div className="mx-auto max-w-[720px]">
              <div className="mb-10">
                <span className="inline-flex items-center gap-2 font-body text-eyebrow font-semibold uppercase tracking-[3px] text-gold">
                  <Building2 size={16} /> Espace professionnel
                </span>
                <h2 className="mt-4 font-display text-[40px] font-semibold uppercase leading-none tracking-[-1.5px] text-navy lg:text-[52px]">
                  Rejoindre le réseau
                </h2>
                <p className="mt-4 max-w-[560px] font-body text-[16px] leading-[26px] text-navy/70">
                  Remplissez le formulaire. Après validation par notre équipe, vous recevrez vos accès pour gérer routes, véhicules, horaires et réservations.
                </p>
              </div>

              <div className="grid gap-5 border border-navy/10 bg-white p-8 lg:p-10">
                <Field label="Nom de la coopérative *">
                  <input className={FIELD} value={form.displayName} onChange={(e) => set("displayName", e.target.value)} placeholder="Soatrans Plus" />
                </Field>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Raison sociale">
                    <input className={FIELD} value={form.legalName} onChange={(e) => set("legalName", e.target.value)} placeholder="Soatrans SARL" />
                  </Field>
                  <Field label="Région">
                    <input className={FIELD} value={form.region} onChange={(e) => set("region", e.target.value)} placeholder="Analamanga" />
                  </Field>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Personne de contact *">
                    <input className={FIELD} value={form.contactName} onChange={(e) => set("contactName", e.target.value)} placeholder="Rakoto Jean" />
                  </Field>
                  <Field label="Téléphone *">
                    <input className={FIELD} value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="034 00 000 00" />
                  </Field>
                </div>
                <Field label="Email *">
                  <input className={FIELD} type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="contact@coop.mg" />
                </Field>
                <Field label="Adresse">
                  <input className={FIELD} value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Lot II… Antananarivo" />
                </Field>
                <Field label="Message (optionnel)">
                  <textarea value={form.message} onChange={(e) => set("message", e.target.value)} rows={3}
                    className={`${FIELD} h-auto resize-none py-3.5`}
                    placeholder="Flotte, lignes desservies, volume…" />
                </Field>
                <div className="flex justify-end pt-1">
                  <button type="button" className={GOLD_BTN} onClick={submit} disabled={saving}>
                    {saving ? "Envoi…" : "Envoyer la demande"} <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className={LABEL}>{label}</span>
      {children}
    </label>
  );
}
