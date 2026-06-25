"use client";
import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Building2, ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Button, Card, db, id, toast } from "@cp/ui";
import { Input } from "@/components/ui/input";

const empty = { displayName: "", legalName: "", region: "", contactName: "", email: "", phone: "", address: "", message: "" };

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
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-5 py-12">
        {done ? (
          <Card className="flex flex-col items-center gap-3 p-12 text-center">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-baobab/15 text-baobab"><CheckCircle2 size={36} /></span>
            <h1 className="font-display text-2xl font-bold">Demande envoyée</h1>
            <p className="max-w-md text-ink-soft">Notre équipe examine votre demande. Vous serez contacté à <span className="font-semibold text-ink">{form.email}</span> dès validation, avec vos accès à l&apos;espace coopérative.</p>
            <Link href="/" className="mt-2"><Button variant="outline">Retour à l&apos;accueil</Button></Link>
          </Card>
        ) : (
          <>
            <div className="mb-6">
              <span className="inline-flex items-center gap-2 rounded-full bg-orange/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-orange"><Building2 size={14} /> Espace professionnel</span>
              <h1 className="mt-4 font-display text-3xl font-bold">Inscrire votre coopérative</h1>
              <p className="mt-2 text-ink-soft">Remplissez le formulaire. Après validation par notre équipe, vous recevrez vos accès pour gérer routes, véhicules, horaires et réservations.</p>
            </div>

            <Card className="grid gap-4 p-6">
              <Field label="Nom de la coopérative *">
                <Input value={form.displayName} onChange={(e) => set("displayName", e.target.value)} placeholder="Soatrans Plus" />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Raison sociale">
                  <Input value={form.legalName} onChange={(e) => set("legalName", e.target.value)} placeholder="Soatrans SARL" />
                </Field>
                <Field label="Région">
                  <Input value={form.region} onChange={(e) => set("region", e.target.value)} placeholder="Analamanga" />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Personne de contact *">
                  <Input value={form.contactName} onChange={(e) => set("contactName", e.target.value)} placeholder="Rakoto Jean" />
                </Field>
                <Field label="Téléphone *">
                  <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="034 00 000 00" />
                </Field>
              </div>
              <Field label="Email *">
                <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="contact@coop.mg" />
              </Field>
              <Field label="Adresse">
                <Input value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Lot II… Antananarivo" />
              </Field>
              <Field label="Message (optionnel)">
                <textarea value={form.message} onChange={(e) => set("message", e.target.value)} rows={3}
                  className="w-full rounded-[--radius] border border-ink/12 bg-paper px-3.5 py-2.5 text-[15px] text-ink outline-none transition-all placeholder:text-ink-soft/40 focus:border-orange focus:ring-2 focus:ring-orange/20"
                  placeholder="Flotte, lignes desservies, volume…" />
              </Field>
              <div className="flex justify-end pt-1">
                <Button size="lg" onClick={submit} disabled={saving}>
                  {saving ? "Envoi…" : "Envoyer la demande"} <ArrowRight size={18} />
                </Button>
              </div>
            </Card>
          </>
        )}
      </main>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      {children}
    </label>
  );
}
