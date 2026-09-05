import Image from "next/image";
import CtaButton from "@/components/ui/CtaButton";

/* Band y7053..7645 at 1440: bg #002c3f with a fixed backdrop
   (`lte-parallax-yes`) under a #001620 overlay. */

export default function TransportTrust() {
  return (
    <section className="relative overflow-hidden bg-navy py-[190px] lg:py-[178px]">
      <div className="absolute inset-0">
        <Image
          src="/wp-content/uploads/2025/02/parallax_01.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
        />
      </div>
      <span className="absolute inset-0 bg-[#001620]/70" />

      <div className="relative mx-auto max-w-shell px-[15px] text-center">
        <h2 className="mx-auto max-w-[1000px] font-display text-[40px] font-semibold uppercase leading-[42px] tracking-[-1.5px] text-white lg:text-section lg:leading-[63px] lg:tracking-[-2.5px]">
          Confort, sécurité et ponctualité – tout pour votre trajet
        </h2>
        <CtaButton href="/about-us" className="mt-[40px]">
          En savoir plus
        </CtaButton>
      </div>
    </section>
  );
}
