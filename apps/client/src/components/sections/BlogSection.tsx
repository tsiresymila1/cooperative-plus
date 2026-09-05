import Image from "next/image";
import Link from "next/link";
import SectionHeading from "@/components/ui/SectionHeading";
import { POSTS } from "./data";

/* Band y8777..9635 at 1440, bg #eff3f4. Heading y8897 h127, card row y9045 h510.
   Card image hover scales to 1.15 (audit.json hovers[4..9], the
   `attachment-tourix-blog-square` elements). */

export default function BlogSection() {
  return (
    <section className="bg-mist py-[187px] lg:py-[141px]">
      <div className="mx-auto max-w-shell px-[15px]">
        <SectionHeading
          eyebrow="Our blog"
          title="Recent articles"
          align="center"
          className="mb-[60px]"
        />

        <div className="grid gap-[30px] md:grid-cols-2 lg:grid-cols-3">
          {POSTS.map((post) => (
            <article key={post.href} className="group">
              <Link
                href={post.href}
                className="relative block aspect-[500/347] overflow-hidden"
              >
                <Image
                  src={post.img}
                  alt=""
                  fill
                  sizes="(max-width: 1024px) 100vw, 450px"
                  className="object-cover transition-[transform,scale] duration-700 ease-out group-hover:scale-[1.15]"
                />
              </Link>

              <div className="pt-[26px]">
                <div className="mb-3 flex items-center gap-3 font-body text-[12px] font-semibold uppercase tracking-[2px]">
                  <span className="text-gold">{post.category}</span>
                  <span className="text-navy/50">
                    {post.date}
                    {post.comments}
                  </span>
                </div>

                <h4 className="font-display text-[24px] font-semibold uppercase leading-[1.1] text-navy">
                  <Link
                    href={post.href}
                    className="transition-colors duration-500 hover:text-gold"
                  >
                    {post.title}
                  </Link>
                </h4>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
