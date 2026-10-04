"use client";

import { useState } from "react";
import { CheckCircle2, ImagePlus, MessageSquareText, X } from "lucide-react";
import { submitProductFeedbackForm, type ProductFeedbackPayload } from "../lib/feedback-client";
import { Button, Card } from "./ui";
import { Field, Input, Select, Textarea, type FormVariant } from "./form";
import { cn } from "../lib/cn";

type FeedbackFormProps = {
  source: ProductFeedbackPayload["source"];
  apiBase?: string;
  cooperativeId?: string;
  defaultName?: string;
  defaultEmail?: string;
  variant?: FormVariant;
};

export function FeedbackForm({
  source,
  apiBase = "",
  cooperativeId,
  defaultName = "",
  defaultEmail = "",
  variant = "app",
}: FeedbackFormProps) {
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [category, setCategory] = useState<ProductFeedbackPayload["category"]>("suggestion");
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (file && file.size > 5 * 1024 * 1024) {
      setError("L’image doit peser au maximum 5 Mo.");
      return;
    }
    setBusy(true);
    try {
      await submitProductFeedbackForm(apiBase, {
        source,
        category,
        name,
        email,
        message,
        cooperativeId,
      }, file);
      setSent(true);
      setMessage("");
      setFile(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "L’envoi a échoué. Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <Card className={cn("p-7 text-center sm:p-10", variant === "site" && "rounded-none border-navy/10 shadow-none")}>
        <CheckCircle2 className="mx-auto text-success" size={42} />
        <h2 className="mt-4 font-display text-xl font-semibold text-ink">Merci pour votre retour</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
          Votre message a bien été transmis à l’équipe Coopérative Plus.
        </p>
        <Button className={cn("mt-6", variant === "site" && "rounded-none border-navy/20")} variant="outline" onClick={() => setSent(false)}>
          Envoyer un autre feedback
        </Button>
      </Card>
    );
  }

  return (
    <Card className={cn("p-5 sm:p-7", variant === "site" && "rounded-none border-navy/10 p-8 shadow-none sm:p-10")}>
      <form className="grid gap-5" onSubmit={submit}>
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-laterite/10 text-laterite">
            <MessageSquareText size={20} />
          </span>
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">Votre feedback</h2>
            <p className="mt-1 text-sm text-ink-soft">Signalez un problème ou partagez une suggestion.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom" variant={variant}>
            <Input variant={variant} value={name} onChange={(event) => setName(event.target.value)} required minLength={2} maxLength={120} autoComplete="name" />
          </Field>
          <Field label="Email" variant={variant}>
            <Input variant={variant} value={email} onChange={(event) => setEmail(event.target.value)} required type="email" maxLength={254} autoComplete="email" />
          </Field>
        </div>

        <Field label="Type de retour" variant={variant}>
          <Select variant={variant} value={category} onChange={(event) => setCategory(event.target.value as ProductFeedbackPayload["category"])}>
            <option value="suggestion">Suggestion</option>
            <option value="bug">Problème technique</option>
            <option value="difficulty">Difficulté d’utilisation</option>
            <option value="other">Autre</option>
          </Select>
        </Field>

        <Field label="Message" hint={`${message.length}/4000 caractères`} variant={variant}>
          <Textarea variant={variant} value={message} onChange={(event) => setMessage(event.target.value)} required minLength={10} maxLength={4_000} rows={7} placeholder="Décrivez votre expérience avec le plus de détails possible…" />
        </Field>

        <Field label="Capture d’écran (facultatif)" hint="PNG, JPEG ou WebP — 5 Mo maximum." variant={variant}>
          {file ? (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-line bg-ink/[.02] px-4 py-3 text-sm">
              <span className="min-w-0 truncate text-ink">{file.name}</span>
              <button type="button" onClick={() => setFile(null)} className="shrink-0 text-ink-soft hover:text-danger" aria-label="Retirer l’image">
                <X size={17} />
              </button>
            </div>
          ) : (
            <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-line bg-ink/[.02] px-4 py-4 text-center hover:border-laterite/50">
              <ImagePlus size={20} className="text-ink-soft" />
              <span className="mt-2 text-sm text-ink-soft">Choisir une image</span>
              <input
                className="sr-only"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
            </label>
          )}
        </Field>

        {error && <p role="alert" className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}
        <Button type="submit" disabled={busy} className={cn("w-full sm:w-auto sm:justify-self-end", variant === "site" && "h-[60px] rounded-none bg-gold px-8 font-display font-semibold uppercase tracking-[0.5px] text-navy hover:bg-navy hover:text-white")}>
          {busy ? "Envoi…" : "Envoyer le feedback"}
        </Button>
      </form>
    </Card>
  );
}
