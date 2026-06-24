import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@cp/ui";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Politique de confidentialité · Cooperative Plus",
  description:
    "Comment Cooperative Plus collecte, utilise et protège vos données personnelles lors de la réservation de taxi-brousse à Madagascar.",
};

const UPDATED = "24 juin 2026";

export default function Privacy() {
  return (
    <main className="min-h-screen bg-sand">
      <SiteHeader />

      <article className="mx-auto max-w-3xl px-5 py-12">
        <p className="font-mono text-xs uppercase tracking-widest text-ink-soft/50">Mentions légales</p>
        <h1 className="mt-2 font-display text-4xl font-bold text-ink">Politique de confidentialité</h1>
        <p className="mt-2 text-sm text-ink-soft/70">Dernière mise à jour : {UPDATED}</p>

        <div className="mt-8 space-y-8 text-[15px] leading-7 text-ink-soft">
          <Section title="1. Qui sommes-nous">
            <p>
              Cooperative Plus (« l'application », « nous ») est une plateforme qui permet de comparer les départs de
              taxi-brousse, choisir un siège et payer une réservation auprès de coopératives de transport à Madagascar.
              Pour toute question relative à vos données, contactez-nous à{" "}
              <a className="text-orange hover:underline" href="mailto:tsiresymila@gmail.com">tsiresymila@gmail.com</a>.
            </p>
          </Section>

          <Section title="2. Données que nous collectons">
            <ul className="list-disc space-y-1.5 pl-5">
              <li><b>Compte</b> : adresse email (pour la connexion par code à usage unique).</li>
              <li><b>Profil</b> : nom et numéro de téléphone que vous renseignez.</li>
              <li><b>Réservations</b> : trajets recherchés, sièges sélectionnés, billets émis (QR code), coopérative concernée.</li>
              <li><b>Paiement</b> : moyen de paiement choisi et statut de la transaction. Nous ne stockons pas les numéros de carte ; les paiements sont traités par les prestataires (Mobile Money, opérateur de carte).</li>
              <li><b>Données techniques</b> : informations d'appareil et de connexion strictement nécessaires au fonctionnement et à la sécurité.</li>
            </ul>
          </Section>

          <Section title="3. Pourquoi nous utilisons vos données">
            <ul className="list-disc space-y-1.5 pl-5">
              <li>Créer et sécuriser votre compte.</li>
              <li>Gérer vos recherches, réservations, sièges et billets électroniques.</li>
              <li>Traiter les paiements et transmettre la réservation à la coopérative.</li>
              <li>Vous fournir une assistance et vous contacter au sujet d'une réservation.</li>
              <li>Prévenir la fraude et garantir la sécurité du service.</li>
            </ul>
          </Section>

          <Section title="4. Base légale">
            <p>
              Le traitement repose sur l'<b>exécution du contrat</b> (fournir le service de réservation que vous demandez),
              sur votre <b>consentement</b> lorsque requis, et sur notre <b>intérêt légitime</b> à sécuriser la plateforme.
            </p>
          </Section>

          <Section title="5. Partage des données">
            <p>Nous ne vendons pas vos données. Elles peuvent être partagées avec :</p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li><b>La coopérative de transport</b> concernée par votre réservation (nom et contact du passager, sièges) afin d'assurer le voyage.</li>
              <li><b>Les prestataires de paiement</b> (Mobile Money, opérateurs de carte) pour traiter la transaction.</li>
              <li><b>Notre hébergeur de base de données</b> (InstantDB) qui stocke les données pour notre compte.</li>
            </ul>
          </Section>

          <Section title="6. Conservation">
            <p>
              Nous conservons vos données aussi longtemps que votre compte est actif et le temps nécessaire à la gestion
              des réservations, des obligations légales et comptables. Vous pouvez demander la suppression à tout moment.
            </p>
          </Section>

          <Section title="7. Sécurité">
            <p>
              Nous mettons en œuvre des mesures techniques et organisationnelles raisonnables pour protéger vos données.
              La connexion se fait par code à usage unique envoyé par email ; aucun mot de passe n'est stocké.
            </p>
          </Section>

          <Section title="8. Vos droits">
            <p>
              Vous pouvez demander l'accès, la rectification, l'export ou la suppression de vos données, ainsi que la
              suppression de votre compte. Écrivez-nous à{" "}
              <a className="text-orange hover:underline" href="mailto:tsiresymila@gmail.com">tsiresymila@gmail.com</a>, ou
              consultez la page{" "}
              <Link className="text-orange hover:underline" href="/data-deletion">Suppression de vos données</Link>. Nous
              répondons dans un délai raisonnable.
            </p>
          </Section>

          <Section title="9. Mineurs">
            <p>Le service n'est pas destiné aux personnes de moins de 16 ans sans le consentement d'un parent ou tuteur.</p>
          </Section>

          <Section title="10. Modifications">
            <p>
              Cette politique peut être mise à jour. La date de dernière mise à jour figure en haut de page ; les
              changements importants seront signalés dans l'application.
            </p>
          </Section>

          <Section title="11. Contact">
            <p>
              Cooperative Plus — Antananarivo, Madagascar.{" "}
              <a className="text-orange hover:underline" href="mailto:tsiresymila@gmail.com">tsiresymila@gmail.com</a>
            </p>
          </Section>
        </div>

        <div className="mt-12 flex items-center justify-between border-t border-ink/8 pt-6 text-sm">
          <Link href="/" className="text-ink-soft/70 transition-colors hover:text-ink">← Accueil</Link>
          <Link href="/terms" className="text-ink-soft/70 transition-colors hover:text-ink">Conditions d'utilisation</Link>
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
