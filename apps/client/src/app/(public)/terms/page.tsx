import Link from "next/link";
import type { Metadata } from "next";
import PageBanner from "@/components/site/PageBanner";

export const metadata: Metadata = {
  title: "Conditions d'utilisation · Cooperative Plus",
  description: "Conditions générales d'utilisation de l'application de réservation Cooperative Plus.",
};

const UPDATED = "24 juin 2026";

export default function Terms() {
  return (
    <main>
      <PageBanner title="Conditions" />

      <section className="py-[100px]">
        <div className="mx-auto max-w-narrow px-[15px]">
          <article className="border border-navy/10 bg-white p-8 lg:p-14">
            <p className="font-body text-eyebrow font-semibold uppercase tracking-[3px] text-gold">Mentions légales</p>
            <h1 className="mt-3 font-display text-[40px] font-semibold uppercase leading-none tracking-[-1.5px] text-navy lg:text-[52px]">Conditions d'utilisation</h1>
            <p className="mt-3 font-body text-[14px] text-navy/50">Dernière mise à jour : {UPDATED}</p>

            <div className="mt-10 space-y-9 font-body text-[16px] leading-[26px] text-navy/70">
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
                  <a className="text-gold hover:underline" href="mailto:tsiresymila@gmail.com">tsiresymila@gmail.com</a>
                </p>
              </Section>
            </div>

            <div className="mt-12 flex items-center justify-between border-t border-navy/10 pt-6 font-body text-[14px]">
              <Link href="/" className="text-navy/60 transition-colors hover:text-gold">← Accueil</Link>
              <Link href="/privacy" className="text-navy/60 transition-colors hover:text-gold">Politique de confidentialité</Link>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 font-display text-[24px] font-semibold uppercase tracking-[-0.5px] text-navy">{title}</h2>
      {children}
    </section>
  );
}
