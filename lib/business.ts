export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://hixhametina.com";

export const BUSINESS = {
  name: "Hixhame Tina",
  phoneDisplay: "+383 45 836 605",
  phoneHref: "tel:+38345836605",
  phoneDigits: "38345836605",
  instagramHandle: "@hixhametina",
  instagramUrl: "https://www.instagram.com/hixhametina/",
  heroImage: "/images/hixhame-cups-hero-1280.webp",
  heroImageMobile: "/images/hixhame-cups-hero-800.webp",
} as const;

export function whatsappUrl(message: string) {
  return `https://wa.me/${BUSINESS.phoneDigits}?text=${encodeURIComponent(message)}`;
}
