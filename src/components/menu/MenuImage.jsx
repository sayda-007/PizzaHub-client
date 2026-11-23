import Image from "next/image";

export default function MenuImage({ src, alt, sizes }) {
  if (!src) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-muted px-4 text-center text-xs text-ink-muted">
        No image available
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      className="object-cover object-center"
    />
  );
}
