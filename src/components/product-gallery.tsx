"use client";

import { useState } from "react";
import { ProductImage } from "@/components/product-image";

export function ProductGallery({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
  const [active, setActive] = useState(0);
  const list = images.length > 0 ? images : ["/products/placeholder.svg"];

  return (
    <div className="grid gap-4">
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-line bg-surface-2">
        <ProductImage
          src={list[active]}
          alt={alt}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 45vw"
          className="object-contain p-3 sm:p-4"
        />
      </div>
      {list.length > 1 ? (
        <div className="flex gap-3">
          {list.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setActive(index)}
              className={`relative h-16 w-16 overflow-hidden rounded-xl border transition sm:h-20 sm:w-20 ${
                active === index
                  ? "border-brand-600 ring-2 ring-brand-200"
                  : "border-line hover:border-line-strong"
              }`}
              aria-label={`View image ${index + 1}`}
            >
              <ProductImage
                src={image}
                alt=""
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
