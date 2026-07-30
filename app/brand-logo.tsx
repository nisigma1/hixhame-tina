/* eslint-disable @next/next/no-img-element */
type BrandLogoProps = { className?: string; compact?: boolean };

export function BrandLogo({ className = "", compact = false }: BrandLogoProps) {
  return compact ? (
    <img
      className={className}
      src="/brand/hixhame-tina-mark-reference.webp"
      width="118"
      height="108"
      alt=""
      aria-hidden="true"
      decoding="async"
    />
  ) : (
    <img
      className={className}
      src="/brand/hixhame-tina-horizontal-reference.webp"
      width="480"
      height="108"
      alt=""
      aria-hidden="true"
      decoding="async"
    />
  );
}
