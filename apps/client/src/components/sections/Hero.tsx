import Image from "next/image";
import BookingForm from "./BookingForm";

/* Hero band: 1440x1057 at desktop, 390x624 at mobile (styles.390.json) — the
   booking form drops out of the banner below lg and occupies its own band.
   Heading 130px / lh 110.5 / -2.5px white.
   The source runs a 1500ms zoom on the backdrop (motion.json entranceAnims[1],
   `lte-zs-slider-inner`); done in CSS so it plays without JS and stills under
   prefers-reduced-motion. */

export default function Hero() {
  return (
    <>
      <section className="relative h-[624px] overflow-hidden bg-navy lg:h-[90vh]">
        <div className="absolute inset-0 animate-[heroZoom_1500ms_ease-out_forwards]">
          <Image
            src="/wp-content/uploads/2025/02/SLIDE_01.jpg?v=3"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-black/40" />

        <div className="relative mx-auto flex h-full max-w-shell flex-col justify-center px-[15px] pt-[100px] lg:justify-start lg:pt-[227px]">
          {/* Measured at 1440: "European" is gold (rgb 206,180,95) at 130/600,
              the remaining two lines white at the same size. */}
          {/* The source sets the strapline beside the heading, bottom-aligned
              with its last line — not stacked under it. */}
          <div className="flex flex-col items-start gap-6 lg:flex-row lg:items-end lg:gap-[24px]">
            <h1 className="font-display text-[64px] font-semibold uppercase leading-[0.85] tracking-[-1.5px] text-white lg:text-hero lg:leading-[110.5px] lg:tracking-[-2.5px]">
              <span className="text-gold">Voyager</span>
              <br />
              partout à
              <br />
              Madagascar
            </h1>

            <p className="max-w-[260px] font-body text-[16px] font-bold uppercase leading-[25.6px] tracking-[1px] text-white/80 lg:mb-[30px] lg:max-w-[190px]">
              Réservez et payez vos trajets en ligne, en toute simplicité
            </p>
          </div>

          {/* Source pins the form at y=857 in a 1057-tall hero — 96px off the
              bottom — rather than letting it sit under the centred heading. */}
          <BookingForm className="mt-[60px] hidden lg:absolute lg:inset-x-[15px] lg:bottom-[96px] lg:mt-0 lg:grid" />
        </div>
      </section>

      <div className="mx-auto max-w-shell px-[15px] py-[71px] lg:hidden">
        <BookingForm />
      </div>
    </>
  );
}
