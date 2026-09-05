import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import CtaButton from "@/components/ui/CtaButton";

/* Band y6212..7053 at 1440 — 841 tall, bg #eff3f4. Measured at 1440:
     left col  x=25   "Bus travel" 150/600/lh120 gold, "with easy" same in navy
                      h4 36/600/lh34.2 (max 440 wide), "Read More" 16/600 link
     right col x=1110 w=315: h6 24/600/lh33.6 + p 16/300/lh25.6, twice,
                      then the View Schedule button
   Content runs 6322..6871, so the band is 110 top / 182 bottom.
   The ticket artwork is a pale watermark behind the row — in the flow it made
   this band 354px too tall. */

const TRUST = [
  "Curabitur imperdiet varius lacus, id placerat purus vulputate non. Fusce in felis vel arcu maximus placerat eu ut arcu.",
  "Curabitur imperdiet varius lacus, id placerat purus vulputate non. Fusce in felis vel arcu maximus placerat eu ut arcu.",
];

export default function BusTravel() {
  return (
    <section className="relative overflow-hidden bg-mist pb-[259px] pt-[80px] lg:pb-[218px] lg:pt-[110px]">
      <div className="relative mx-auto max-w-shell px-[15px]">
        <div className="grid gap-[50px] lg:grid-cols-2 lg:gap-0">
          <div className="lg:pt-[40px]">
            <h2 className="font-display font-semibold uppercase">
              <span className="block text-[70px] leading-[70px] tracking-[-2px] text-gold lg:text-display lg:leading-[120px] lg:tracking-[-2.5px]">
                Bus travel
              </span>
              <span className="block text-[70px] leading-[70px] tracking-[-2px] text-navy lg:text-display lg:leading-[120px] lg:tracking-[-2.5px]">
                with easy
              </span>
            </h2>

            <h4 className="mt-[44px] max-w-[440px] font-display text-[28px] font-semibold uppercase leading-[1.05] tracking-[-0.5px] text-navy lg:text-h4">
              Affordable tickets for fast and comfortable bus trips across
              Europe
            </h4>

            <Link
              href="/about-us"
              className="mt-[50px] inline-flex items-center gap-2 font-display text-[16px] font-semibold uppercase text-navy transition-colors duration-500 hover:text-gold"
            >
              Read more
              <ArrowRight className="size-4" strokeWidth={2} />
            </Link>
          </div>

          <div className="lg:justify-self-end">
            <div className="space-y-[40px] lg:w-[315px]">
              {TRUST.map((copy, i) => (
                <div key={i}>
                  <h4 className="mb-[15px] font-display text-[24px] font-semibold uppercase leading-[33.6px] text-navy">
                    Transport you can trust
                  </h4>
                  <p className="font-body text-[16px] font-light leading-[25.6px] text-navy/70">
                    {copy}
                  </p>
                </div>
              ))}
            </div>

            <CtaButton href="/tours" className="mt-[75px]">
              View schedule
            </CtaButton>
          </div>
        </div>

        {/* Measured 564x593 at 1440 and fully opaque — an earlier pass rendered
            it as a pale watermark, which washed the section out. At 390 the
            source carries it as a real in-flow block (~378 tall) under the
            trust column; from lg it sits at x=540 (525 inside the 15px gutter),
            564x593, ending just before the right column at x=1110. */}
        <Image
          src="/wp-content/uploads/2025/02/tickets_img.png"
          alt=""
          width={564}
          height={593}
          sizes="(max-width: 1024px) 90vw, 564px"
          aria-hidden
          className="mx-auto mt-[40px] h-[378px] w-auto object-contain motion-safe:animate-[ticketReveal_900ms_cubic-bezier(0.16,1,0.3,1)_both] lg:pointer-events-none lg:absolute lg:left-[525px] lg:top-[40px] lg:mt-0 lg:h-[593px] lg:w-[564px] lg:max-w-none"
        />
      </div>
    </section>
  );
}
