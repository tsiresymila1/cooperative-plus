import Image from "next/image";
import SectionHeading from "@/components/ui/SectionHeading";
import CtaButton from "@/components/ui/CtaButton";

/* Band y2062..3051 at 1440. Two numbered blocks beside a portrait image. */

const POINTS = [
  {
    n: "01.",
    title: "Travel between cities easily and comfortably",
    lines: [
      "Air conditioning and USB chargers in every bus – top comfort!",
      "Free Wi-Fi is now available on all our buses.",
    ],
  },
  {
    n: "02.",
    title: "Save time and money – choose the bus",
    lines: [
      "Comfort, safety, and speed – everything for your journey.",
      "With us, always on time and hassle-free.",
    ],
  },
];

/* The image differs per route: the homepage ships about_img-1, /about-us ships
   about_img. Measured 565x716 on about-us. */
export default function WhatYouGet({
  image = "/wp-content/uploads/2025/02/about_img-1-808x1024.jpg",
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
              eyebrow="What will you get"
              title="Day and night routes is available for the best time for you"
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

            <CtaButton href="/about-us" className="mt-[50px]">
              Read more
            </CtaButton>
          </div>
        </div>
      </div>
    </section>
  );
}
