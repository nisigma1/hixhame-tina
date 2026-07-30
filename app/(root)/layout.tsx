import type { Metadata } from "next";
import { fontVariables } from "../fonts";
import { themeBootScript } from "../theme-script";
import { BUSINESS, SITE_URL } from "@/lib/business";
import { locales } from "@/lib/i18n";
import "../globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: BUSINESS.name,
  description: "Hixhame Tina",
  alternates: {
    canonical: "/sq/",
    languages: Object.fromEntries([
      ...locales.map((locale) => [locale, `/${locale}/`]),
      ["x-default", "/sq/"],
    ]),
  },
  robots: {
    index: false,
    follow: true,
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
};

export default function RootRedirectLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="sq" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className={fontVariables}>{children}</body>
    </html>
  );
}
