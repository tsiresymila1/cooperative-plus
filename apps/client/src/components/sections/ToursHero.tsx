import Image from "next/image";

/* /home-tours-2 hero — a different design from the default homepage, measured
   at 1440 (band 0..1079):
     backdrop  top_bg_02_4k-scaled.jpg, cover, 50% 0%
     heading   180px centred, "intercity" gold + "tours" white, y≈162
     strapline 24px white centred, y=366
     artwork   bus_new-1.png, 1420x756 at y=483, x=10 — a cut-out bus laid
               over the backdrop, its lower 160px running past the hero edge.
               Measured across widths: the bus is a FIXED width capped at
               1520px (1520 at 1600/1920/2560, 1420 at 1440), centred — not a
               vw. A fluid vw width blew it up to 2524px on a 2560 screen and
               buried the heading. Hero bottom, off the shape divider:
               431 / 760 / 966 / 1080 / 1134 at 390 / 900 / 1225 / 1440 / 1600+. The
               rebuild used one height for every width, which is what threw the
               bus out of the frame — not the artwork rules. The bus runs 159px
               past the hero edge above 1200 and 91px below it, drawn OVER the
               curve (z-20 vs z-10) and not clipped by the section — the source
               shows the whole vehicle sitting on the white band. Clipping it,
               or letting the curve paint on top, slices the bus in half.
   The rebuild previously reused the default hero (left-aligned 130px heading
   over a photo), which is why this page never matched. */

export default function ToursHero() {
  return (
    <section className="relative h-[431px] bg-navy md:h-[760px] lg:h-[966px] xl:h-[1080px] 3xl:h-[1134px]">
      <Image
        src="/wp-content/uploads/2025/03/top_bg_02_4k-scaled.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-top"
      />

      <div className="relative mx-auto flex h-full max-w-shell flex-col items-center px-[15px] pt-[140px] text-center lg:pt-[162px]">
        <h1 className="font-display text-[64px] font-semibold uppercase leading-[0.9] tracking-[-2px] text-white lg:text-[180px] lg:leading-[150px] lg:tracking-[-4px]">
          <span className="text-gold">Intercity</span> tours
        </h1>

        <p className="mt-[40px] max-w-[300px] font-display text-[16px] font-semibold uppercase leading-[1.4] text-white lg:max-w-[430px] lg:text-[24px]">
          Book tickets online and travel with ease around all Europe
        </p>
      </div>

      {/* Elementor shape divider at the bottom of the hero: 1440x94 at y=986,
          filled with the mist of the band below so the navy edge curves. The
          rebuild had a straight edge, which is the difference the eye catches
          first and the percentage never mentioned. */}
      <svg
        aria-hidden
        viewBox="0 0 595.3 38.9"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[26px] w-full -scale-y-100 fill-mist md:h-[59px] lg:h-[80px] xl:h-[94px]"
      >
        <path d="M297.7,14.9c114.1,0,218.3,9.1,297.6,24V0L0,0l0,38.9C79.4,24,183.5,14.9,297.7,14.9z" />
      </svg>

      <Image
        src="/wp-content/uploads/2025/05/bus_new-1.png"
        alt=""
        width={1420}
        height={756}
        priority
        sizes="(max-width: 1024px) 140vw, 1420px"
        aria-hidden
        className="pointer-events-none absolute bottom-[-91px] left-1/2 z-20 w-[95vw] max-w-[1520px] -translate-x-1/2 object-contain md:w-[98.6vw] lg:bottom-[-159px]"
      />
    </section>
  );
}
