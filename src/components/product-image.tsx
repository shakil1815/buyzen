"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

const FALLBACK_IMAGE = "/products/placeholder.svg";

export function ProductImage({
  src,
  alt,
  ...props
}: Omit<ImageProps, "src"> & { src: string }) {
  const [imageSrc, setImageSrc] = useState(src);

  return (
    <Image
      {...props}
      src={imageSrc}
      alt={alt}
      onError={() => {
        if (imageSrc !== FALLBACK_IMAGE) setImageSrc(FALLBACK_IMAGE);
      }}
    />
  );
}
