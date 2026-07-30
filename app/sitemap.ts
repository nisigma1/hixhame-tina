import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/business";
import { locales } from "@/lib/i18n";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(
    locales.map((locale) => [locale, `${SITE_URL}/${locale}/`]),
  );

  return locales.map((locale) => ({
    url: `${SITE_URL}/${locale}/`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: locale === "sq" ? 1 : 0.9,
    alternates: {
      languages: {
        ...languages,
        "x-default": `${SITE_URL}/sq/`,
      },
    },
  }));
}
