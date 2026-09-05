import Image from "next/image";
import SectionHeading from "@/components/ui/SectionHeading";
import {
  Wifi,
  Tv,
  Coffee,
  ShowerHead,
  Plug,
  Snowflake,
  Play,
} from "lucide-react";
import { BENEFITS } from "./data";

/* Band y3051..4432 at 1440, bg #002c3f. Icon row y3494 h164, video panel
   y3738 h810 with a #001620 overlay (`lte-overlay-black`). */

const ICONS = [Wifi, Tv, Coffee, ShowerHead, Plug, Snowflake];

/* The source wraps " comfortable seats and facilities " in a <span> that the
   theme paints gold (`lte-subcolor-main`); the rest of the h2 stays white. */
const DEFAULT_TITLE = (
  <>
    Nos véhicules sont équipés de{" "}
    <span className="text-gold">sièges confortables et d'équipements</span> pour
    un trajet agréable et pratique
  </>
);

/* Two layouts in the source:
     "full"  (homepage)  — full-width navy band, centred heading, one row of six
                           icons joined by a dashed rule, video panel under it.
     "split" (/about-us) — navy panel on the left half with a left-aligned
                           heading and a 3x2 icon grid, benefits_img.jpg filling
                           the right half (measured 720x863 at x=720, cover). */
export default function Benefits({
  title = DEFAULT_TITLE,
  showVideo = true,
  layout = "full",
  image = "/wp-content/uploads/2025/03/benefits_img.jpg",
}: {
  title?: React.ReactNode;
  showVideo?: boolean;
  layout?: "full" | "split";
  image?: string;
} = {}) {
  if (layout === "split") {
    return (
      <section className="grid lg:grid-cols-2">
        <div className="bg-navy px-[15px] py-[70px] lg:py-[90px] lg:pl-[calc((100vw-1410px)/2+15px)] lg:pr-[60px]">
          <SectionHeading
            eyebrow="Nos avantages"
            tone="dark"
            title={title}
            className="mb-[50px] max-w-[520px]"
          />

          <ul className="grid grid-cols-2 gap-x-[20px] gap-y-[40px] sm:grid-cols-3">
            {BENEFITS.map((label, i) => {
              const Icon = ICONS[i];
              return (
                <li key={label} className="flex flex-col items-start">
                  <Icon className="mb-[14px] size-[46px] text-gold" strokeWidth={1} />
                  <span className="font-display text-[16px] font-semibold uppercase tracking-[0.5px] text-white">
                    {label}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="relative min-h-[360px] lg:min-h-[863px]">
          <Image
            src={image}
            alt=""
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
      </section>
    );
  }

  return (
    <section className="bg-navy py-[93px] lg:py-[61px]">
      <div className="mx-auto max-w-shell px-[15px]">
        <SectionHeading
          eyebrow="Our Benefits"
          tone="dark"
          align="center"
          title={<span className="mx-auto block max-w-[1000px]">{title}</span>}
          className="mb-[60px]"
        />

        {/* Source row: `lte-block-icon icons-count-6`, 1440x164, each item 210
            wide, icons joined by a dashed rule at their centre. */}
        <ul className="relative mb-[60px] grid grid-cols-2 gap-y-[30px] md:grid-cols-3 lg:grid-cols-6">
          <span
            aria-hidden
            className="pointer-events-none absolute left-0 right-0 top-[32px] hidden border-t border-dashed border-white/25 lg:block"
          />
          {BENEFITS.map((label, i) => {
            const Icon = ICONS[i];
            return (
              <li
                key={label}
                className="relative flex flex-col items-center text-center"
              >
                <span className="mb-[18px] bg-navy px-[18px]">
                  <Icon className="size-[64px] text-gold" strokeWidth={1} />
                </span>
                <span className="font-display text-[18px] font-semibold uppercase tracking-[0.5px] text-white">
                  {label}
                </span>
              </li>
            );
          })}
        </ul>

        {showVideo ? (
        <div className="relative h-[550px] overflow-hidden md:h-[560px] lg:h-[810px]">
          <Image
            src="/wp-content/uploads/2025/02/video-bg.jpg"
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
          />
          <span className="absolute inset-0 bg-black/35" />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <button
              type="button"
              aria-label="Lancer la visite vidéo"
              className="group flex size-[80px] items-center justify-center rounded-full bg-white text-navy transition-colors duration-500 hover:bg-gold"
            >
              <Play className="size-6 translate-x-0.5 fill-current" />
            </button>
            <span className="mt-[22px] font-display text-[24px] font-semibold uppercase tracking-[2px] text-gold">
              Visite vidéo
            </span>
          </div>
        </div>
        ) : null}
      </div>
    </section>
  );
}
