import PageBanner from "@/components/site/PageBanner";
import SectionHeading from "@/components/ui/SectionHeading";
import Accordion from "@/components/ui/Accordion";
import CtaButton from "@/components/ui/CtaButton";

export const metadata = { title: "FAQ — Coopérative Plus" };

const TAGS = ["Réservation", "Paiement", "Bagages", "Annulation"];

const GENERAL: { q: string; a: string }[] = [
  { q: "Comment réserver un billet en ligne ?", a: "Choisissez votre trajet depuis la page Trajets, sélectionnez la date et le nombre de places, puis suivez les étapes jusqu'à la confirmation. Vous recevez un billet avec un QR code à présenter à l'embarquement." },
  { q: "Le taxi-brousse fait-il des arrêts en cours de route ?", a: "Oui, la plupart des lignes interurbaines prévoient des arrêts pour les repas et les pauses. La durée totale affichée sur chaque trajet en tient compte." },
  { q: "Puis-je choisir ma place à l'avance ?", a: "Oui. Lors de la réservation, un plan du véhicule vous permet de sélectionner les sièges disponibles avant de payer." },
  { q: "Comment récupérer mon billet ?", a: "Votre billet est disponible immédiatement après la réservation dans votre espace « Mes réservations » et par le lien de confirmation. Vous pouvez le télécharger ou l'imprimer." },
  { q: "Que faire si je rate mon départ ?", a: "Présentez-vous à la gare routière de la coopérative : selon les places disponibles, un report sur un départ ultérieur peut être proposé. Contactez la coopérative au plus tôt." },
];

const PRICING: { q: string; a: string }[] = [
  { q: "Quels moyens de paiement acceptez-vous ?", a: "Le paiement en ligne (Mobile Money / carte) est disponible sur les coopératives qui l'ont activé. Sinon, vous pouvez réserver en ligne et régler à la gare avant le départ." },
  { q: "Le paiement en ligne est-il sécurisé ?", a: "Oui. Les paiements sont traités par notre prestataire agréé ; nous ne stockons jamais les données de votre carte." },
  { q: "Puis-je annuler et être remboursé ?", a: "Une réservation non payée peut être annulée à tout moment, ce qui libère les places. Pour un billet déjà payé, les conditions de remboursement dépendent de la coopérative." },
  { q: "Existe-t-il des réductions pour les enfants ?", a: "Certaines coopératives proposent des tarifs réduits. Le prix affiché correspond au tarif adulte ; renseignez-vous auprès de la coopérative pour les tarifs enfant." },
  { q: "Le prix affiché est-il par personne ?", a: "Oui, le prix indiqué est par adulte. Le montant total est calculé selon le nombre de places réservées." },
];

export default function FaqPage() {
  return (
    <main>
      <PageBanner title="FAQ" image="/wp-content/uploads/2025/04/inner_HEADER_02.jpg" />

      <section className="py-[110px] lg:py-[131px]">
        <div className="mx-auto max-w-shell px-[15px]">
          <div className="grid gap-[60px] lg:grid-cols-2">
            <div>
              <SectionHeading
                title={<>Une aide au quotidien<br />pour nos voyageurs</>}
                className="mb-[26px]"
              />
              <p className="max-w-[520px] font-body text-[16px] font-light leading-[25.6px] text-navy/70">
                Coopérative Plus réunit des transporteurs de tout Madagascar pour
                vous offrir des départs réguliers, des tarifs justes et une
                réservation simple, en ligne comme à la gare.
              </p>

              <ul className="mt-[30px] flex flex-wrap gap-[10px]">
                {TAGS.map((t) => (
                  <li key={t} className="border border-navy/10 px-[18px] py-[10px] font-body text-[14px] text-navy">
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="mb-4 font-display text-h4 font-semibold uppercase text-navy">
                Besoin d'aide supplémentaire ?
              </h4>
              <p className="max-w-[520px] font-body text-[16px] font-light leading-[25.6px] text-navy/70">
                Vous ne trouvez pas votre réponse ? Parcourez nos trajets pour
                voir les horaires et les disponibilités, ou contactez directement
                la coopérative concernée depuis votre réservation.
              </p>
              <CtaButton href="/search" className="mt-[36px]">
                Voir les trajets
              </CtaButton>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-mist py-[110px]">
        <div className="mx-auto max-w-shell px-[15px]">
          <div className="grid gap-[60px] lg:grid-cols-2">
            <div>
              <SectionHeading title="Informations générales" className="mb-[30px]" />
              <Accordion items={GENERAL} defaultOpen={0} />
            </div>
            <div>
              <SectionHeading title="Tarifs & paiement" className="mb-[30px]" />
              <Accordion items={PRICING} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
