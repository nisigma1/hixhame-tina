/* eslint-disable @next/next/no-img-element */
type BrandLogoProps = {
  className?: string;
  compact?: boolean;
  responsive?: boolean;
  loading?: "eager" | "lazy";
};

export function BrandLogo({
  className = "",
  compact = false,
  responsive = false,
  loading = "eager",
}: BrandLogoProps) {
  if (responsive) {
    return (
      <picture className="brand-picture">
        <source
          media="(max-width: 360px)"
          srcSet="/brand/hixhame-tina-mark-reference.webp"
        />
        <img
          className={className}
          src="/brand/hixhame-tina-horizontal-reference.webp"
          width="480"
          height="108"
          alt=""
          aria-hidden="true"
          decoding="async"
          fetchPriority="high"
          loading={loading}
        />
      </picture>
    );
  }

  return compact ? (
    <img
      className={className}
      src="/brand/hixhame-tina-mark-reference.webp"
      width="118"
      height="108"
      alt=""
      aria-hidden="true"
      decoding="async"
      loading={loading}
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
      loading={loading}
    />
  );
}
