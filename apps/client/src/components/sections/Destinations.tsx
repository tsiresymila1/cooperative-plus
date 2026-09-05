import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import { DESTINATIONS, COUNTRIES, FLAG } from "./data";

/* Band y1060..2062 at 1440. Card row y1287 h520 (cards 330x490), country
   strip y1837 h225 — a 6-across grid of bordered pills, each a flag + name,
   not a run of plain links.
   Hover scales the card image to 1.1 (audit.json hovers[0..3]); the transition
   names `scale` explicitly because Tailwind v4 emits it as a standalone
   property and `transition-transform` alone would let it snap. */

export default function Destinations({
  padding = "py-[45px] lg:py-[67px]",
}: {
  /** per-route vertical rhythm; the default is the homepage band */
  padding?: string;
} = {}) {
  return (
    <section className={padding}>
      <div className="mx-auto max-w-shell px-[15px]">
        <SectionHeading
          eyebrow="Let’s ride together"
          title="Popular destinations"
          className="mb-[20px] lg:mb-[50px]"
        />

        <div className="grid grid-cols-1 gap-[30px] sm:grid-cols-2 lg:grid-cols-4">
          {DESTINATIONS.map((d) => (
            <Link
              key={d.name}
              href={`/tours?to=${d.to}&passengers=1`}
              className="group relative block h-[357px] overflow-hidden lg:h-[490px]"
            >
              <Image
                src={d.img}
                alt={d.name}
                fill
                sizes="(max-width: 1024px) 50vw, 330px"
                className="object-cover transition-[transform,scale] duration-700 ease-out group-hover:scale-110"
              />
              <span className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-navy/85 to-transparent" />

              <span className="absolute inset-x-0 bottom-0 flex items-center gap-3 p-[26px]">
                <Image
                  src={FLAG(d.cc)}
                  alt=""
                  width={22}
                  height={16}
                  className="h-4 w-[22px] shrink-0 object-cover"
                />
                <span className="font-display text-[22px] font-semibold uppercase leading-none tracking-[0.5px] text-white">
                  {d.name}
                </span>
                <ArrowRight
                  className="ml-auto size-5 text-white transition-colors duration-500 group-hover:text-gold"
                  strokeWidth={1.5}
                />
              </span>
            </Link>
          ))}
        </div>

        <ul className="mt-[20px] grid grid-cols-2 gap-[10px] lg:mt-[50px] sm:grid-cols-3 lg:grid-cols-6">
          {COUNTRIES.map((c) => (
            <li key={c.name}>
              <Link
                href={`/tours?to=${c.to}&passengers=1`}
                className="flex h-[55px] items-center gap-3 border border-navy/10 px-[18px] font-body text-[14px] font-normal text-navy transition-colors duration-500 hover:border-gold hover:text-gold"
              >
                <Image
                  src={FLAG(c.cc)}
                  alt=""
                  width={22}
                  height={16}
                  className="h-4 w-[22px] shrink-0 object-cover"
                />
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
