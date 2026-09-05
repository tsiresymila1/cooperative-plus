import Image from "next/image";
import Link from "next/link";
import { Search, ChevronRight } from "lucide-react";

/* Source blog sidebar, measured: Categories (with counts) first, then a Search
   box, then an About-us widget with an image and a line of copy — in that order.
   Column starts at x=979 next to an 823-wide article column. */

const CATEGORIES = [
  { label: "Booking", count: 8, href: "/category/booking" },
  { label: "Bus travel", count: 4, href: "/category/bus-travel" },
  { label: "Charters", count: 1, href: "/category/charters" },
  { label: "Comfort", count: 3, href: "#" },
  { label: "Online", count: 11, href: "#" },
  { label: "Tickets", count: 9, href: "#" },
  { label: "Transport", count: 3, href: "#" },
];

export default function BlogSidebar() {
  return (
    <aside className="space-y-[50px]">
      <div>
        <h4 className="mb-[22px] font-display text-[24px] font-semibold uppercase text-navy">
          Categories
        </h4>
        <ul>
          {CATEGORIES.map((c) => (
            <li key={c.label} className="border-b border-navy/10 last:border-0">
              <Link
                href={c.href}
                className="flex h-[46px] items-center justify-between font-body text-[14px] text-navy transition-colors duration-500 hover:text-gold"
              >
                <span className="flex items-center gap-2">
                  <ChevronRight className="size-3.5 text-gold" strokeWidth={2} />
                  {c.label}
                </span>
                <span className="text-navy/40">({c.count})</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <form className="relative">
        <input
          type="search"
          name="s"
          placeholder="Search…"
          aria-label="Search posts"
          className="h-[60px] w-full border border-navy/15 bg-white pl-5 pr-14 font-body text-[16px] text-navy outline-none transition-colors duration-300 focus:border-gold"
        />
        <button
          type="submit"
          aria-label="Search"
          className="absolute right-0 top-0 flex h-[60px] w-[56px] items-center justify-center bg-gold text-navy transition-colors duration-[250ms] hover:bg-navy hover:text-white"
        >
          <Search className="size-5" strokeWidth={1.8} />
        </button>
      </form>

      <div>
        <h4 className="mb-[22px] font-display text-[24px] font-semibold uppercase text-navy">
          About us
        </h4>
        <div className="relative mb-5 aspect-[480/334] overflow-hidden">
          <Image
            src="/wp-content/uploads/2025/04/sidebar_img-480x334.jpg"
            alt=""
            fill
            sizes="360px"
            className="object-cover"
          />
        </div>
        <p className="font-body text-[16px] font-light leading-[25.6px] text-navy/70">
          Your trips just got easier – sit back and enjoy the ride. Travel on
          modern transport with the best drivers!
        </p>
      </div>
    </aside>
  );
}
