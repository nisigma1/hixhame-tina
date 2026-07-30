import Link from "next/link";
import { BrandLogo } from "../brand-logo";
import { localeNames, locales } from "@/lib/i18n";

export default function LocaleRedirectPage() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: localeRedirectScript }} />
      <main className="locale-redirect">
        <BrandLogo className="locale-redirect-logo" />
        <h1>Hixhame Tina</h1>
        <p>Po ju dërgojmë te versioni i përshtatshëm i faqes.</p>
        <nav aria-label="Zgjidh gjuhën">
          {locales.map((locale) => (
            <Link href={`/${locale}/`} hrefLang={locale} lang={locale} key={locale}>
              {localeNames[locale]}
            </Link>
          ))}
        </nav>
        <noscript>
          <meta httpEquiv="refresh" content="0; url=/sq/" />
          <p>
            <Link href="/sq/">Hape faqen në shqip</Link>
          </p>
        </noscript>
      </main>
    </>
  );
}

const localeRedirectScript = `
(() => {
  const supported = ['sq', 'en', 'de', 'fr', 'tr', 'it'];
  const cookie = document.cookie
    .split('; ')
    .find((item) => item.startsWith('ht_locale='))
    ?.split('=')[1];
  const preferred = Array.isArray(navigator.languages)
    ? navigator.languages
    : [navigator.language];
  const browserLocale = preferred
    .map((value) => String(value || '').toLowerCase().split('-')[0])
    .find((value) => supported.includes(value));
  const locale = supported.includes(cookie) ? cookie : browserLocale || 'sq';
  document.cookie =
    'ht_locale=' + locale +
    '; Path=/; Max-Age=31536000; SameSite=Lax' +
    (location.protocol === 'https:' ? '; Secure' : '');
  location.replace('/' + locale + '/' + (location.hash || ''));
})();
`;
