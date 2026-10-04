import type { Metadata } from "next";
import { FeedbackPageClient } from "@/components/feedback-page-client";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Donner votre feedback",
  description: "Signalez un problème ou proposez une amélioration à Coopérative Plus.",
  path: "/feedback",
  noIndex: true,
});

export default function FeedbackPage() {
  return (
    <main className="bg-sand px-4 pb-16 pt-32 sm:pt-36">
      <div className="mx-auto max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[.18em] text-gold-deep">Votre avis nous aide</p>
        <h1 className="mt-2 font-display text-3xl font-bold uppercase text-navy sm:text-4xl">Donner votre feedback</h1>
        <p className="mb-7 mt-3 max-w-xl text-sm leading-relaxed text-navy/65 sm:text-base">
          Dites-nous ce qui fonctionne bien et ce que nous devons améliorer.
        </p>
        <FeedbackPageClient />
      </div>
    </main>
  );
}
