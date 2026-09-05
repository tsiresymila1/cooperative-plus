import Image from "next/image";
import Link from "next/link";

/* Inner-page banner, identical across every route: `lte-page-header
   lte-parallax-yes` sits at y=100 with h=518 on #002c3f, so the block spans
   0..618 including the header band above it — the section is 618 tall, not 518.
   Title measured 90px / 600 white; breadcrumb 12px / 500, "Home" white and the
   current page gold. */

export default function PageBanner({
  title,
  image = "/wp-content/uploads/2025/04/inner_HEADER-1.jpg",
  height = "h-[618px]",
}: {
  title: string;
  image?: string;
  /** shop runs a short 308px banner (208 band + header); others are 618. */
  height?: string;
}) {
  return (
    <section
      className={`relative overflow-hidden bg-navy pt-[100px] ${height}`}
    >
      {/* Inner-page heroes are parallax in the source (`lte-parallax-yes`):
          the backdrop is fixed to the viewport while the band scrolls over it. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-fixed bg-center"
        style={{ backgroundImage: `url('${image}')` }}
      />
      <span className="absolute inset-0 bg-[#001620]/65" />

      <div className="relative mx-auto flex h-full max-w-shell flex-col items-center justify-center px-[15px] text-center">
        <h1 className="font-display text-[48px] font-semibold uppercase leading-none tracking-[-1.5px] text-white lg:text-[90px] lg:tracking-[-2.5px]">
          {title}
        </h1>

        <nav aria-label="Breadcrumb" className="mt-[26px]">
          <ol className="flex items-center gap-2 font-body text-[12px] font-medium uppercase tracking-[2px]">
            <li>
              <Link
                href="/"
                className="text-white transition-colors duration-500 hover:text-gold"
              >
                Home
              </Link>
            </li>
            <li aria-hidden className="text-white/50">
              //
            </li>
            <li className="text-gold" aria-current="page">
              {title}
            </li>
          </ol>
        </nav>
      </div>
    </section>
  );
}
