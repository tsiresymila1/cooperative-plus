import Image from "next/image";
import Link from "next/link";
import type { Post } from "@/components/sections/posts";

/* Card image hover scales to 1.15 (audit.json hovers[4..9]); `scale` is named
   in the transition because Tailwind v4 emits it as a standalone property. */

export default function PostCard({
  post,
  layout = "classic",
}: {
  post: Post;
  layout?: "classic" | "grid";
}) {
  return (
    <article className={layout === "classic" ? "mb-[60px]" : ""}>
      <Link
        href={post.slug}
        className={`group relative block overflow-hidden ${
          layout === "classic" ? "aspect-[1400/971]" : "aspect-[500/347]"
        }`}
      >
        {post.img ? (
          <Image
            src={post.img}
            alt=""
            fill
            sizes={layout === "classic" ? "(max-width: 1024px) 100vw, 900px" : "(max-width: 1024px) 100vw, 450px"}
            className="object-cover transition-[transform,scale] duration-700 ease-out group-hover:scale-[1.15]"
          />
        ) : (
          <span className="absolute inset-0 bg-mist" />
        )}
        {/* Measured: `lte-cats` is position:absolute, 90x28, inset 20px from the
            image corner — a badge over the photo, not a line of text under it. */}
        {post.cat ? (
          <span className="absolute left-5 top-5 z-10 bg-gold px-3 py-1 font-body text-[12px] font-semibold uppercase tracking-[1px] text-navy">
            {post.cat}
          </span>
        ) : null}
      </Link>

      <div className="pt-[26px]">
        <div className="mb-3 flex flex-wrap items-center gap-2 font-body text-[12px] font-semibold uppercase tracking-[2px]">
          <span aria-hidden className="size-[5px] rounded-full bg-gold" />
          <span className="text-navy/50">
            {post.date} · {post.comments}
          </span>
        </div>

        <h3
          className={`font-display font-semibold uppercase leading-[1.1] text-navy ${
            layout === "classic" ? "text-[36px] tracking-[-0.5px]" : "text-[24px] leading-[26.4px] tracking-[-0.5px]"
          }`}
        >
          <Link
            href={post.slug}
            className="transition-colors duration-500 hover:text-gold"
          >
            {post.title}
          </Link>
        </h3>

        {layout === "classic" ? (
          <p className="mt-[18px] font-body text-[16px] font-light leading-[25.6px] text-navy/70">
            {post.excerpt}
          </p>
        ) : null}
      </div>
    </article>
  );
}
