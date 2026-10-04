"use client";

import { useState } from "react";
import { CheckCircle2, ImagePlus, Star, X } from "lucide-react";
import { submitTripReviewForm } from "../lib/feedback-client";
import { Button, Card } from "./ui";
import { Field, Input, Textarea, type FormVariant } from "./form";
import { cn } from "../lib/cn";

export function TripReviewForm({
  bookingReference,
  apiBase = "",
  defaultName = "",
  defaultEmail = "",
  variant = "app",
}: {
  bookingReference: string;
  apiBase?: string;
  defaultName?: string;
  defaultEmail?: string;
  variant?: FormVariant;
}) {
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (!rating) return setError("Choisissez une note entre 1 et 5.");
    if (file && file.size > 5 * 1024 * 1024) return setError("L’image doit peser au maximum 5 Mo.");
    setBusy(true);
    try {
      await submitTripReviewForm(apiBase, { bookingReference, name, email, rating, comment }, file);
      setSent(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "L’envoi a échoué. Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <Card className={cn("p-8 text-center", variant === "site" && "rounded-none border-navy/10 shadow-none")}>
        <CheckCircle2 className="mx-auto text-success" size={42} />
        <h2 className="mt-4 font-display text-xl font-semibold text-ink">Merci pour votre avis</h2>
        <p className="mt-2 text-sm text-ink-soft">Il a été transmis à la coopérative et à notre équipe.</p>
      </Card>
    );
  }

  return (
    <Card className={cn("p-5 sm:p-7", variant === "site" && "rounded-none border-navy/10 p-8 shadow-none sm:p-10")}>
      <form className="grid gap-5" onSubmit={submit}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-soft">Réservation {bookingReference}</p>
          <h2 className="mt-2 font-display text-xl font-semibold text-ink">Comment s’est passé votre trajet ?</h2>
        </div>
        <Field label="Votre note" variant={variant}>
          <div className="flex gap-1" role="radiogroup" aria-label="Note du trajet">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={rating === value}
                aria-label={`${value} étoile${value > 1 ? "s" : ""}`}
                onClick={() => setRating(value)}
                className="rounded-md p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-laterite/40"
              >
                <Star size={30} className={cn(value <= rating ? "fill-warning text-warning" : "text-ink/20")} />
              </button>
            ))}
          </div>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom" variant={variant}><Input variant={variant} value={name} onChange={(event) => setName(event.target.value)} required minLength={2} maxLength={120} /></Field>
          <Field label="Email associé à la réservation" variant={variant}><Input variant={variant} value={email} onChange={(event) => setEmail(event.target.value)} required type="email" maxLength={254} /></Field>
        </div>
        <Field label="Votre commentaire" hint={`${comment.length}/4000 caractères`} variant={variant}>
          <Textarea variant={variant} value={comment} onChange={(event) => setComment(event.target.value)} required minLength={10} maxLength={4_000} rows={7} placeholder="Ponctualité, accueil, confort…" />
        </Field>
        <Field label="Photo (facultatif)" hint="PNG, JPEG ou WebP — 5 Mo maximum." variant={variant}>
          {file ? (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-line px-4 py-3 text-sm">
              <span className="min-w-0 truncate">{file.name}</span>
              <button type="button" onClick={() => setFile(null)} aria-label="Retirer l’image"><X size={17} /></button>
            </div>
          ) : (
            <label className="flex min-h-20 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-line bg-ink/[.02] px-4 py-4 text-sm text-ink-soft hover:border-laterite/50">
              <ImagePlus size={19} /> Ajouter une image
              <input className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
            </label>
          )}
        </Field>
        {error && <p role="alert" className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}
        <Button type="submit" disabled={busy} className={cn("w-full sm:w-auto sm:justify-self-end", variant === "site" && "h-[60px] rounded-none bg-gold px-8 font-display font-semibold uppercase tracking-[0.5px] text-navy hover:bg-navy hover:text-white")}>{busy ? "Envoi…" : "Envoyer mon avis"}</Button>
      </form>
    </Card>
  );
}
