"use client";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { db, notDeleted } from "@cp/ui";
import SectionHeading from "@/components/ui/SectionHeading";

const CARD_IMGS = [
  "/wp-content/uploads/2025/02/05_budapest-365x430.jpg",
  "/wp-content/uploads/2025/02/02_rome-365x430.jpg",
  "/wp-content/uploads/2025/02/03_prague-365x430.jpg",
  "/wp-content/uploads/2025/02/06_warszawa-365x430.jpg",
];

/* Template "Popular destinations" band — same design; real Coopérative Plus
   destinations (feature), template photos cycled for the cards, links to /search. */
export default function Destinations({ padding = "py-[45px] lg:py-[67px]" }: { padding?: string } = {}) {
  const { data } = db.useQuery({ destinations: { $: { where: { isGlobal: true }, order: { name: "asc" } } } });
  const all = [...new Map((data?.destinations ?? []).filter(notDeleted).map((d: any) => [d.name, d])).values()] as any[];
  const featured = all.filter((d) => d.isPopular).concat(all.filter((d) => !d.isPopular)).slice(0, 4);
  const rest = all.slice(0, 18);

  return (
    <section className={padding}>
      <div className="mx-auto max-w-shell px-[15px]">
        <SectionHeading eyebrow="Voyageons ensemble" title="Destinations populaires" className="mb-[20px] lg:mb-[50px]" />

        <div className="grid grid-cols-1 gap-[30px] sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((d, i) => (
            <Link key={d.id ?? d.name} href={`/search?to=${encodeURIComponent(d.name)}&pax=1`} className="group relative block h-[357px] overflow-hidden lg:h-[490px]">
              <Image src={CARD_IMGS[i % CARD_IMGS.length]} alt={d.name} fill sizes="(max-width: 1024px) 50vw, 330px" className="object-cover transition-[transform,scale] duration-700 ease-out group-hover:scale-110" />
              <span className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-navy/85 to-transparent" />
              <span className="absolute inset-x-0 bottom-0 flex items-center gap-3 p-[26px]">
                <span className="font-display text-[22px] font-semibold uppercase leading-none tracking-[0.5px] text-white">{d.name}</span>
                <ArrowRight className="ml-auto size-5 text-white transition-colors duration-500 group-hover:text-gold" strokeWidth={1.5} />
              </span>
            </Link>
          ))}
        </div>

        {rest.length > 0 && (
          <ul className="mt-[20px] grid grid-cols-2 gap-[10px] sm:grid-cols-3 lg:mt-[50px] lg:grid-cols-6">
            {rest.map((c) => (
              <li key={c.id ?? c.name}>
                <Link href={`/search?to=${encodeURIComponent(c.name)}&pax=1`} className="flex h-[55px] items-center gap-3 border border-navy/10 px-[18px] font-body text-[14px] font-normal text-navy transition-colors duration-500 hover:border-gold hover:text-gold">
                  <MapPin className="size-4 shrink-0 text-gold" strokeWidth={2} />
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
