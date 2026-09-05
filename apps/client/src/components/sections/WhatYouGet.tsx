import Image from "next/image";
import SectionHeading from "@/components/ui/SectionHeading";
import CtaButton from "@/components/ui/CtaButton";

/* Band y2062..3051 at 1440. Two numbered blocks beside a portrait image. */

const POINTS = [
  {
    n: "01.",
    title: "Voyagez entre les villes en toute simplicité et confort",
    lines: [
      "Des véhicules entretenus et des chauffeurs expérimentés – sérénité assurée !",
      "Réservez votre place à l'avance sur toutes nos lignes.",
    ],
  },
  {
    n: "02.",
    title: "Gagnez du temps et de l'argent – choisissez le taxi-brousse",
    lines: [
      "Confort, sécurité et ponctualité – tout pour votre trajet.",
      "Avec nous, des départs fiables et sans tracas.",
    ],
  },
];

/* The image differs per route: the homepage ships about_img-1, /about-us ships
   about_img. Measured 565x716 on about-us. */
export default function WhatYouGet({
  image = "/wp-content/uploads/2025/02/about_img-1-808x1024.jpg?v=2",
  padding = "py-[128px] lg:py-[140px]",
}: {
  image?: string;
  /** /about-us runs this band 144px shorter than the homepage does. */
  padding?: string;
} = {}) {
  return (
    <section className={padding}>
      <div className="mx-auto max-w-shell px-[15px]">
        <div className="grid items-center gap-[60px] lg:grid-cols-2">
          <div className="relative aspect-[808/1024] w-full max-w-[560px] overflow-hidden 3xl:max-w-[624px]">
            <Image
              src={image}
              alt=""
              fill
              sizes="(max-width: 1024px) 100vw, 560px"
              className="object-cover"
            />
          </div>

          <div>
            <SectionHeading
              eyebrow="Ce que vous obtenez"
              title="Des départs de jour comme de nuit, à l'horaire qui vous convient"
              className="mb-[50px] max-w-[480px]"
            />

            {/* dashed rule between the two numbered blocks, as in the source */}
            <div className="divide-y divide-dashed divide-navy/20">
              {POINTS.map((p) => (
                <div key={p.n} className="flex gap-[24px] py-[28px] first:pt-0">
                  <span className="font-display text-[36px] font-semibold leading-none text-gold">
                    {p.n}
                  </span>
                  <div>
                    <h4 className="mb-3 font-display text-[24px] font-semibold uppercase leading-[1.1] text-navy">
                      {p.title}
                    </h4>
                    {p.lines.map((line) => (
                      <p
                        key={line}
                        className="font-body text-[16px] font-light leading-[25.6px] text-navy/70"
                      >
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <CtaButton href="/about" className="mt-[50px]">
              En savoir plus
            </CtaButton>
          </div>
        </div>
      </div>
    </section>
  );
}
