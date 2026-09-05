import Link from "next/link";
import type { Metadata } from "next";
import { Mail } from "lucide-react";
import PageBanner from "@/components/site/PageBanner";

export const metadata: Metadata = {
  title: "Suppression des données · Cooperative Plus",
  description:
    "Comment demander la suppression de votre compte et de vos données personnelles dans l'application Cooperative Plus.",
};

const UPDATED = "24 juin 2026";
const EMAIL = "tsiresymila@gmail.com";
const SUBJECT = encodeURIComponent("Suppression de mon compte Cooperative Plus");
const BODY = encodeURIComponent(
  "Bonjour,\n\nJe souhaite supprimer mon compte Cooperative Plus et les données associées.\n\nEmail du compte : \nNom : \n\nMerci.",
);

export default function DataDeletion() {
  return (
    <main>
      <PageBanner title="Suppression des données" />

      <section className="py-[100px]">
        <div className="mx-auto max-w-narrow px-[15px]">
          <article className="border border-navy/10 bg-white p-8 lg:p-14">
            <p className="font-body text-eyebrow font-semibold uppercase tracking-[3px] text-gold">Mentions légales</p>
            <h1 className="mt-3 font-display text-[40px] font-semibold uppercase leading-none tracking-[-1.5px] text-navy lg:text-[52px]">Suppression de vos données</h1>
            <p className="mt-3 font-body text-[14px] text-navy/50">Dernière mise à jour : {UPDATED}</p>

            <div className="mt-10 space-y-9 font-body text-[16px] leading-[26px] text-navy/70">
              <Section title="Demander la suppression">
                <p>
                  Vous pouvez à tout moment demander la suppression de votre compte Cooperative Plus et des données
                  personnelles associées. Envoyez-nous un email depuis l'adresse de votre compte :
                </p>
                <a
                  href={`mailto:${EMAIL}?subject=${SUBJECT}&body=${BODY}`}
                  className="mt-5 inline-flex h-[60px] items-center gap-2 bg-gold px-7 font-display text-[16px] font-semibold uppercase tracking-[0.5px] text-navy transition-colors duration-[250ms] hover:bg-navy hover:text-white"
                >
                  <Mail size={18} /> Demander la suppression
                </a>
                <p className="mt-4 font-body text-[14px] text-navy/60">
                  Ou écrivez directement à{" "}
                  <a className="text-gold hover:underline" href={`mailto:${EMAIL}`}>{EMAIL}</a> en précisant l'email et le
                  nom de votre compte.
                </p>
              </Section>

              <Section title="Ce qui est supprimé">
                <ul className="list-disc space-y-1.5 pl-5">
                  <li>Votre compte et vos identifiants de connexion.</li>
                  <li>Votre profil : nom, numéro de téléphone, email.</li>
                  <li>Votre historique de recherches et de réservations, et vos billets électroniques.</li>
                </ul>
              </Section>

              <Section title="Ce qui peut être conservé">
                <p>
                  Certaines informations strictement nécessaires aux obligations légales et comptables (par exemple les
                  enregistrements de transactions) peuvent être conservées de façon anonymisée pendant la durée imposée par la
                  loi, sans permettre de vous réidentifier.
                </p>
              </Section>

              <Section title="Délai">
                <p>
                  Nous traitons votre demande dans un délai raisonnable, généralement sous <b className="text-navy">30 jours</b>. Nous pouvons vous
                  contacter pour vérifier votre identité avant de procéder.
                </p>
              </Section>

              <Section title="Contact">
                <p>
                  Cooperative Plus — Antananarivo, Madagascar.{" "}
                  <a className="text-gold hover:underline" href={`mailto:${EMAIL}`}>{EMAIL}</a>
                </p>
              </Section>
            </div>

            <div className="mt-12 flex items-center justify-between border-t border-navy/10 pt-6 font-body text-[14px]">
              <Link href="/privacy" className="text-navy/60 transition-colors hover:text-gold">← Confidentialité</Link>
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
