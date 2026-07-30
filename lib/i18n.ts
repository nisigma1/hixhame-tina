import type sqMessages from "../messages/sq.json";

export const locales = ["sq", "en", "de", "fr", "tr", "it"] as const;
export type Locale = (typeof locales)[number];
export type Messages = typeof sqMessages;

export const defaultLocale: Locale = "sq";

export const localeNames: Record<Locale, string> = {
  sq: "Shqip",
  en: "English",
  de: "Deutsch",
  fr: "Français",
  tr: "Türkçe",
  it: "Italiano",
};

export const openGraphLocales: Record<Locale, string> = {
  sq: "sq_AL",
  en: "en_US",
  de: "de_DE",
  fr: "fr_FR",
  tr: "tr_TR",
  it: "it_IT",
};

const loaders: Record<Locale, () => Promise<{ default: unknown }>> = {
  sq: () => import("../messages/sq.json"),
  en: () => import("../messages/en.json"),
  de: () => import("../messages/de.json"),
  fr: () => import("../messages/fr.json"),
  tr: () => import("../messages/tr.json"),
  it: () => import("../messages/it.json"),
};

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export async function getMessages(locale: Locale): Promise<Messages> {
  const fallback = (await loaders.sq()).default as Messages;
  if (locale === defaultLocale) return fallback;

  const localized = (await loaders[locale]()).default;
  return mergeWithFallback(fallback, localized, locale) as Messages;
}

function mergeWithFallback(
  fallback: unknown,
  localized: unknown,
  locale: Locale,
  path = "",
): unknown {
  if (Array.isArray(fallback)) {
    if (!Array.isArray(localized)) {
      reportMissing(locale, path);
      return fallback;
    }
    return fallback.map((item, index) =>
      mergeWithFallback(item, localized[index], locale, `${path}[${index}]`),
    );
  }

  if (fallback && typeof fallback === "object") {
    const source =
      localized && typeof localized === "object"
        ? (localized as Record<string, unknown>)
        : {};
    return Object.fromEntries(
      Object.entries(fallback as Record<string, unknown>).map(([key, value]) => {
        const keyPath = path ? `${path}.${key}` : key;
        return [
          key,
          mergeWithFallback(value, source[key], locale, keyPath),
        ];
      }),
    );
  }

  if (
    localized === undefined ||
    localized === null ||
    typeof localized !== typeof fallback
  ) {
    reportMissing(locale, path);
    return fallback;
  }

  return localized;
}

function reportMissing(locale: Locale, path: string) {
  if (process.env.NODE_ENV !== "production") {
    console.warn(`[i18n] Missing "${path}" in ${locale}; using Albanian.`);
  }
}
