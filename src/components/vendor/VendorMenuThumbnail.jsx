import Image from "next/image";

import { safeImageSrc } from "@/components/vendor/vendor-data";

export default function VendorMenuThumbnail({
  src,
  alt,
  sizes = "(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw",
}) {
  const imageSrc = safeImageSrc(src);

  return (
    <div className="relative aspect-[4/3] overflow-hidden bg-muted">
      {imageSrc ? (
        <Image
          src={imageSrc}
          alt={alt}
          fill
          sizes={sizes}
          unoptimized
          className="object-cover object-center"
        />
      ) : (
        <div className="flex h-full items-center justify-center px-4 text-center text-xs text-ink-muted">
          No image available
        </div>
      )}
    </div>
  );
}
