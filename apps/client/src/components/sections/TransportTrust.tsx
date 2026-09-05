import CtaButton from "@/components/ui/CtaButton";

/* Band y7053..7645: bg #14314C with a FIXED backdrop (parallax) under a
   #0b1f30 overlay. Uses a fixed CSS background (not next/image) so it scrolls
   with a parallax effect. */

export default function TransportTrust() {
  return (
    <section
      className="relative overflow-hidden bg-navy bg-fixed bg-cover bg-center py-[190px] lg:py-[178px]"
      style={{ backgroundImage: "url('/wp-content/uploads/2025/02/parallax_01.jpg')" }}
    >
      <span className="absolute inset-0 bg-[#0b1f30]/70" />

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
