import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fontVariables } from "../fonts";
import { themeBootScript } from "../theme-script";
import { BUSINESS, SITE_URL } from "@/lib/business";
import {
  getMessages,
  isLocale,
  locales,
  openGraphLocales,
  type Locale,
} from "@/lib/i18n";
import "../globals.css";

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: candidate } = await params;
  if (!isLocale(candidate)) return {};

  const locale: Locale = candidate;
  const messages = await getMessages(locale);
  const languageAlternates = Object.fromEntries([
    ...locales.map((option) => [option, `/${option}/`]),
    ["x-default", "/sq/"],
  ]);

  return {
    metadataBase: new URL(SITE_URL),
    title: messages.metadata.title,
    description: messages.metadata.description,
    alternates: {
      canonical: `/${locale}/`,
      languages: languageAlternates,
    },
    openGraph: {
      title: messages.metadata.title,
      description: messages.metadata.description,
      type: "website",
      locale: openGraphLocales[locale],
      alternateLocale: locales
        .filter((option) => option !== locale)
        .map((option) => openGraphLocales[option]),
      siteName: BUSINESS.name,
      url: `/${locale}/`,
      images: [
        {
          url: BUSINESS.heroImage,
          width: 1200,
          height: 630,
          alt: messages.metadata.socialImageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: messages.metadata.title,
      description: messages.metadata.description,
      images: [BUSINESS.heroImage],
    },
    icons: {
      icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    },
    category: "health and beauty",
    creator: BUSINESS.name,
    publisher: BUSINESS.name,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale: candidate } = await params;
  if (!isLocale(candidate)) notFound();

  const locale: Locale = candidate;
  const localeCookieScript = `
    document.cookie =
      'ht_locale=${locale}; Path=/; Max-Age=31536000; SameSite=Lax' +
      (location.protocol === 'https:' ? '; Secure' : '');
  `;

  return (
    <html
      className={fontVariables}
      lang={locale}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
        <script dangerouslySetInnerHTML={{ __html: localeCookieScript }} />
        <link
          rel="preload"
          as="image"
          href={BUSINESS.heroImage}
          imageSrcSet={`${BUSINESS.heroImageMobile} 800w, ${BUSINESS.heroImage} 1280w`}
          imageSizes="(max-width: 980px) 100vw, 52vw"
          fetchPriority="high"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
