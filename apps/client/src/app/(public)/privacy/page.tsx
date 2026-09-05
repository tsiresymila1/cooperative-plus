import Link from "next/link";
import type { Metadata } from "next";
import PageBanner from "@/components/site/PageBanner";

export const metadata: Metadata = {
  title: "Politique de confidentialité · Cooperative Plus",
  description:
    "Comment Cooperative Plus collecte, utilise et protège vos données personnelles lors de la réservation de taxi-brousse à Madagascar.",
};

const UPDATED = "24 juin 2026";

export default function Privacy() {
  return (
    <main>
      <PageBanner title="Confidentialité" />

      <section className="py-[100px]">
        <div className="mx-auto max-w-narrow px-[15px]">
          <article className="border border-navy/10 bg-white p-8 lg:p-14">
            <p className="font-body text-eyebrow font-semibold uppercase tracking-[3px] text-gold">Mentions légales</p>
            <h1 className="mt-3 font-display text-[40px] font-semibold uppercase leading-none tracking-[-1.5px] text-navy lg:text-[52px]">Politique de confidentialité</h1>
            <p className="mt-3 font-body text-[14px] text-navy/50">Dernière mise à jour : {UPDATED}</p>

            <div className="mt-10 space-y-9 font-body text-[16px] leading-[26px] text-navy/70">
              <Section title="1. Qui sommes-nous">
                <p>
                  Cooperative Plus (« l'application », « nous ») est une plateforme qui permet de comparer les départs de
                  taxi-brousse, choisir un siège et payer une réservation auprès de coopératives de transport à Madagascar.
                  Pour toute question relative à vos données, contactez-nous à{" "}
                  <a className="text-gold hover:underline" href="mailto:tsiresymila@gmail.com">tsiresymila@gmail.com</a>.
                </p>
              </Section>

              <Section title="2. Données que nous collectons">
                <ul className="list-disc space-y-1.5 pl-5">
                  <li><b className="text-navy">Compte</b> : adresse email (pour la connexion par code à usage unique).</li>
                  <li><b className="text-navy">Profil</b> : nom et numéro de téléphone que vous renseignez.</li>
                  <li><b className="text-navy">Réservations</b> : trajets recherchés, sièges sélectionnés, billets émis (QR code), coopérative concernée.</li>
                  <li><b className="text-navy">Paiement</b> : moyen de paiement choisi et statut de la transaction. Nous ne stockons pas les numéros de carte ; les paiements sont traités par les prestataires (Mobile Money, opérateur de carte).</li>
                  <li><b className="text-navy">Données techniques</b> : informations d'appareil et de connexion strictement nécessaires au fonctionnement et à la sécurité.</li>
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
                  Le traitement repose sur l'<b className="text-navy">exécution du contrat</b> (fournir le service de réservation que vous demandez),
                  sur votre <b className="text-navy">consentement</b> lorsque requis, et sur notre <b className="text-navy">intérêt légitime</b> à sécuriser la plateforme.
                </p>
              </Section>

              <Section title="5. Partage des données">
                <p>Nous ne vendons pas vos données. Elles peuvent être partagées avec :</p>
                <ul className="mt-2 list-disc space-y-1.5 pl-5">
                  <li><b className="text-navy">La coopérative de transport</b> concernée par votre réservation (nom et contact du passager, sièges) afin d'assurer le voyage.</li>
                  <li><b className="text-navy">Les prestataires de paiement</b> (Mobile Money, opérateurs de carte) pour traiter la transaction.</li>
                  <li><b className="text-navy">Notre hébergeur de base de données</b> (InstantDB) qui stocke les données pour notre compte.</li>
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
                  <a className="text-gold hover:underline" href="mailto:tsiresymila@gmail.com">tsiresymila@gmail.com</a>, ou
                  consultez la page{" "}
                  <Link className="text-gold hover:underline" href="/data-deletion">Suppression de vos données</Link>. Nous
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
                  <a className="text-gold hover:underline" href="mailto:tsiresymila@gmail.com">tsiresymila@gmail.com</a>
                </p>
              </Section>
            </div>

            <div className="mt-12 flex items-center justify-between border-t border-navy/10 pt-6 font-body text-[14px]">
              <Link href="/" className="text-navy/60 transition-colors hover:text-gold">← Accueil</Link>
              <Link href="/terms" className="text-navy/60 transition-colors hover:text-gold">Conditions d'utilisation</Link>
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
