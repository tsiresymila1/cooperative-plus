"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, ShoppingBag } from "lucide-react";
import { addToCart } from "./cart-store";
import type { Product } from "./products";

/* Card image reveals a centred, clickable cart icon on hover (the user asked
   for the add-to-cart affordance to sit in the middle of the image). Clicking
   it bumps the shared cart count that the header badge reads. */

function Stars({ rating }: { rating: number }) {
  return (
    <div className="mb-3 flex justify-center gap-0.5" aria-label={`Rated ${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`size-4 ${n <= rating ? "fill-gold text-gold" : "fill-navy/15 text-navy/15"}`}
          strokeWidth={0}
        />
      ))}
    </div>
  );
}

export default function ProductCard({ product: p }: { product: Product }) {
  return (
    <article className="group text-center">
      <div className="relative aspect-square overflow-hidden bg-mist">
        <Link href="/cart" className="block h-full w-full">
          <Image
            src={p.img}
            alt={p.title}
            fill
            sizes="(max-width: 1024px) 50vw, 284px"
            className="object-cover transition-[transform,scale] duration-700 ease-out group-hover:scale-110"
          />
        </Link>

        {p.old !== null ? (
          <span className="pointer-events-none absolute left-4 top-4 z-10 bg-sale px-3 py-1 font-body text-[12px] font-semibold uppercase text-white">
            Sale
          </span>
        ) : null}

        {/* Centred add-to-cart icon, revealed on hover. */}
        <button
          type="button"
          aria-label={`Add ${p.title} to cart`}
          onClick={() => addToCart(1)}
          className="absolute left-1/2 top-1/2 z-10 flex size-[56px] -translate-x-1/2 -translate-y-1/2 scale-90 items-center justify-center rounded-full bg-gold text-navy opacity-0 transition-all duration-300 ease-out hover:bg-navy hover:text-white group-hover:scale-100 group-hover:opacity-100"
        >
          <ShoppingBag className="size-5" strokeWidth={1.8} />
        </button>
      </div>

      <div className="pt-[22px]">
        <Stars rating={p.rating} />
        <h3 className="font-display text-[24px] font-semibold uppercase text-navy">
          <Link href="/cart" className="transition-colors duration-500 hover:text-gold">
            {p.title}
          </Link>
        </h3>
        <div className="mt-2 flex items-center justify-center gap-2">
          {p.old !== null ? (
            <span className="font-display text-[16px] font-bold text-ash line-through">
              ${p.old.toFixed(2)}
            </span>
          ) : null}
          <span className="font-display text-[16px] font-bold text-gold">
            ${p.price.toFixed(2)}
          </span>
        </div>
      </div>
    </article>
  );
}
