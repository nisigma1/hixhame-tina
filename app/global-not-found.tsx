import Link from "next/link";
import { BrandLogo } from "./brand-logo";
import { fontVariables } from "./fonts";
import { themeBootScript } from "./theme-script";
import { localeNames, locales } from "@/lib/i18n";
import deMessages from "@/messages/de.json";
import enMessages from "@/messages/en.json";
import frMessages from "@/messages/fr.json";
import itMessages from "@/messages/it.json";
import sqMessages from "@/messages/sq.json";
import trMessages from "@/messages/tr.json";
import "./globals.css";

const translations = {
  sq: {
    ...sqMessages.notFound,
    chooseLanguage: sqMessages.common.chooseLanguage,
  },
  en: {
    ...enMessages.notFound,
    chooseLanguage: enMessages.common.chooseLanguage,
  },
  de: {
    ...deMessages.notFound,
    chooseLanguage: deMessages.common.chooseLanguage,
  },
  fr: {
    ...frMessages.notFound,
    chooseLanguage: frMessages.common.chooseLanguage,
  },
  tr: {
    ...trMessages.notFound,
    chooseLanguage: trMessages.common.chooseLanguage,
  },
  it: {
    ...itMessages.notFound,
    chooseLanguage: itMessages.common.chooseLanguage,
  },
};

export default function GlobalNotFound() {
  return (
    <html lang="sq" suppressHydrationWarning>
      <head>
        <title>{`${sqMessages.notFound.title} | Hixhame Tina`}</title>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className={fontVariables}>
        <main className="locale-redirect not-found">
          <BrandLogo className="locale-redirect-logo" />
          <p className="section-kicker" aria-hidden="true">
            404
          </p>
          <h1 data-not-found-title>{sqMessages.notFound.title}</h1>
          <p data-not-found-description>
            {sqMessages.notFound.description}
          </p>
          <Link
            className="button not-found-action"
            href="/sq/"
            data-not-found-action
          >
            {sqMessages.notFound.action}
          </Link>
          <nav
            aria-label={sqMessages.common.chooseLanguage}
            data-not-found-languages
          >
            {locales.map((locale) => (
              <Link
                href={`/${locale}/`}
                hrefLang={locale}
                lang={locale}
                key={locale}
              >
                {localeNames[locale]}
              </Link>
            ))}
          </nav>
        </main>
        <script
          dangerouslySetInnerHTML={{
            __html: createNotFoundScript(translations),
          }}
        />
      </body>
    </html>
  );
}

function createNotFoundScript(copy: typeof translations) {
  return `
(() => {
  const copy = ${JSON.stringify(copy)};
  const supported = ${JSON.stringify(locales)};
  const pathLocale = location.pathname.split('/').filter(Boolean)[0];
  const cookieLocale = document.cookie
    .split('; ')
    .find((item) => item.startsWith('ht_locale='))
    ?.split('=')[1];
  const browserLocale = (navigator.languages || [navigator.language])
    .map((value) => String(value || '').toLowerCase().split('-')[0])
    .find((value) => supported.includes(value));
  const locale = supported.includes(pathLocale)
    ? pathLocale
    : supported.includes(cookieLocale)
      ? cookieLocale
      : browserLocale || 'sq';
  const messages = copy[locale] || copy.sq;
  document.documentElement.lang = locale;
  document.title = messages.title + ' | Hixhame Tina';
  document.querySelector('[data-not-found-title]').textContent = messages.title;
  document.querySelector('[data-not-found-description]').textContent =
    messages.description;
  const action = document.querySelector('[data-not-found-action]');
  action.textContent = messages.action;
  action.href = '/' + locale + '/';
  document
    .querySelector('[data-not-found-languages]')
    .setAttribute('aria-label', messages.chooseLanguage);
})();
`;
}
