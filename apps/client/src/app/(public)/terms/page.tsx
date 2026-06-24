import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@cp/ui";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Conditions d'utilisation · Cooperative Plus",
  description: "Conditions générales d'utilisation de l'application de réservation Cooperative Plus.",
};

const UPDATED = "24 juin 2026";

export default function Terms() {
  return (
    <main className="min-h-screen bg-sand">
      <SiteHeader />

      <article className="mx-auto max-w-3xl px-5 py-12">
        <p className="font-mono text-xs uppercase tracking-widest text-ink-soft/50">Mentions légales</p>
        <h1 className="mt-2 font-display text-4xl font-bold text-ink">Conditions d'utilisation</h1>
        <p className="mt-2 text-sm text-ink-soft/70">Dernière mise à jour : {UPDATED}</p>

        <div className="mt-8 space-y-8 text-[15px] leading-7 text-ink-soft">
          <Section title="1. Objet">
            <p>
              Cooperative Plus met en relation les voyageurs et les coopératives de taxi-brousse à Madagascar pour la
              recherche, la réservation de sièges et le paiement. En utilisant l'application, vous acceptez les présentes
              conditions.
            </p>
          </Section>

          <Section title="2. Compte">
            <p>
              Vous vous connectez par un code à usage unique envoyé à votre email. Vous êtes responsable de l'exactitude
              des informations fournies (nom, téléphone) et de l'usage de votre compte.
            </p>
          </Section>

          <Section title="3. Réservations & billets">
            <p>
              Un siège sélectionné est maintenu temporairement (5 minutes) le temps de finaliser le paiement. Après
              confirmation, un billet électronique avec QR code est émis. Présentez-le au chauffeur à l'embarquement. La
              disponibilité et les horaires sont fournis par les coopératives.
            </p>
          </Section>

          <Section title="4. Paiement">
            <p>
              Le paiement s'effectue selon les moyens proposés par la coopérative (Mobile Money, carte, ou espèces à
              bord). Les transactions par Mobile Money ou carte sont traitées par des prestataires tiers.
            </p>
          </Section>

          <Section title="5. Annulation & remboursement">
            <p>
              Les conditions d'annulation et de remboursement dépendent de chaque coopérative. Contactez la coopérative
              concernée ou notre support pour toute demande.
            </p>
          </Section>

          <Section title="6. Responsabilité">
            <p>
              Le transport est assuré par la coopérative, seule responsable de l'exécution du voyage (départ, ponctualité,
              sécurité à bord). Cooperative Plus fournit l'outil de réservation et ne saurait être tenu responsable des
              retards, annulations ou incidents survenant pendant le trajet.
            </p>
          </Section>

          <Section title="7. Usage acceptable">
            <p>
              Vous vous engagez à ne pas utiliser l'application de manière frauduleuse, à ne pas perturber le service et à
              respecter les lois en vigueur.
            </p>
          </Section>

          <Section title="8. Propriété intellectuelle">
            <p>La marque, le logo et le contenu de l'application appartiennent à Cooperative Plus.</p>
          </Section>

          <Section title="9. Modifications">
            <p>Ces conditions peuvent évoluer. La date de mise à jour figure en haut de page.</p>
          </Section>

          <Section title="10. Contact">
            <p>
              Cooperative Plus — Antananarivo, Madagascar.{" "}
              <a className="text-orange hover:underline" href="mailto:tsiresymila@gmail.com">tsiresymila@gmail.com</a>
            </p>
          </Section>
        </div>

        <div className="mt-12 flex items-center justify-between border-t border-ink/8 pt-6 text-sm">
          <Link href="/" className="text-ink-soft/70 transition-colors hover:text-ink">← Accueil</Link>
          <Link href="/privacy" className="text-ink-soft/70 transition-colors hover:text-ink">Politique de confidentialité</Link>
        </div>
      </article>

      <footer className="border-t border-ink/8 bg-paper">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-5 py-10 text-center text-sm text-ink-soft/60">
          <Logo />
          <p>© 2026 Cooperative Plus · Madagascar</p>
        </div>
      </footer>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 font-display text-xl font-bold text-ink">{title}</h2>
      {children}
    </section>
  );
}
