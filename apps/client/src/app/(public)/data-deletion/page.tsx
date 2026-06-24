import Link from "next/link";
import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { Logo } from "@cp/ui";
import { SiteHeader } from "@/components/site-header";

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
    <main className="min-h-screen bg-sand">
      <SiteHeader />

      <article className="mx-auto max-w-3xl px-5 py-12">
        <p className="font-mono text-xs uppercase tracking-widest text-ink-soft/50">Mentions légales</p>
        <h1 className="mt-2 font-display text-4xl font-bold text-ink">Suppression de vos données</h1>
        <p className="mt-2 text-sm text-ink-soft/70">Dernière mise à jour : {UPDATED}</p>

        <div className="mt-8 space-y-8 text-[15px] leading-7 text-ink-soft">
          <Section title="Demander la suppression">
            <p>
              Vous pouvez à tout moment demander la suppression de votre compte Cooperative Plus et des données
              personnelles associées. Envoyez-nous un email depuis l'adresse de votre compte :
            </p>
            <a
              href={`mailto:${EMAIL}?subject=${SUBJECT}&body=${BODY}`}
              className="mt-4 inline-flex items-center gap-2 rounded-[--radius] bg-orange px-5 py-3 font-semibold text-white transition-opacity hover:opacity-90"
            >
              <Mail size={18} /> Demander la suppression
            </a>
            <p className="mt-3 text-sm text-ink-soft/70">
              Ou écrivez directement à{" "}
              <a className="text-orange hover:underline" href={`mailto:${EMAIL}`}>{EMAIL}</a> en précisant l'email et le
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
              Nous traitons votre demande dans un délai raisonnable, généralement sous <b>30 jours</b>. Nous pouvons vous
              contacter pour vérifier votre identité avant de procéder.
            </p>
          </Section>

          <Section title="Contact">
            <p>
              Cooperative Plus — Antananarivo, Madagascar.{" "}
              <a className="text-orange hover:underline" href={`mailto:${EMAIL}`}>{EMAIL}</a>
            </p>
          </Section>
        </div>

        <div className="mt-12 flex items-center justify-between border-t border-ink/8 pt-6 text-sm">
          <Link href="/privacy" className="text-ink-soft/70 transition-colors hover:text-ink">← Confidentialité</Link>
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
