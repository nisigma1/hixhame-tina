import Image from "next/image";
import { notFound } from "next/navigation";
import { BrandLogo } from "../brand-logo";
import { Faq } from "../faq";
import { Header } from "../header";
import { Icon } from "../icons";
import { BUSINESS, SITE_URL, whatsappUrl } from "@/lib/business";
import {
  getMessages,
  isLocale,
  localeNames,
  locales,
  type Locale,
} from "@/lib/i18n";

const benefitIcons = [
  "drop",
  "shield",
  "leaf",
  "head",
  "spine",
  "mind",
  "nose",
  "female",
  "joint",
  "nerve",
] as const;

export default async function LocalizedHome({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: candidate } = await params;
  if (!isLocale(candidate)) notFound();

  const locale: Locale = candidate;
  const messages = await getMessages(locale);
  const bookingUrl = whatsappUrl(messages.common.whatsappMessage);
  const questionUrl = whatsappUrl(messages.faq.whatsappMessage);

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "HealthAndBeautyBusiness",
      "@id": `${SITE_URL}/#business`,
      name: BUSINESS.name,
      legalName: BUSINESS.name,
      alternateName: [
        `${messages.metadata.hijamaService} - ${messages.common.location}`,
        messages.metadata.cuppingService,
      ],
      slogan: messages.metadata.slogan,
      description: messages.metadata.businessDescription,
      url: `${SITE_URL}/${locale}/`,
      mainEntityOfPage: `${SITE_URL}/${locale}/`,
      telephone: BUSINESS.phoneHref.replace("tel:", ""),
      image: `${SITE_URL}${BUSINESS.heroImage}`,
      logo: `${SITE_URL}/favicon.svg`,
      address: {
        "@type": "PostalAddress",
        addressLocality: "Prishtinë",
        addressRegion: "Prishtinë",
        addressCountry: "XK",
      },
      areaServed: [
        { "@type": "City", name: "Prishtinë" },
        { "@type": "Place", name: "Kolovicë" },
      ],
      audience: {
        "@type": "PeopleAudience",
        audienceType: messages.metadata.audience,
        suggestedGender: "Female",
      },
      availableLanguage: locales.map((code) => ({
        "@type": "Language",
        name: localeNames[code],
        alternateName: code,
      })),
      knowsAbout: [
        messages.metadata.hijamaService,
        messages.metadata.cuppingService,
      ],
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: BUSINESS.name,
        itemListElement: [
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: messages.metadata.hijamaService,
              audience: {
                "@type": "PeopleAudience",
                audienceType: messages.metadata.audience,
              },
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: messages.metadata.cuppingService,
            },
          },
        ],
      },
      sameAs: [BUSINESS.instagramUrl],
      inLanguage: locale,
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: BUSINESS.name,
      url: `${SITE_URL}/${locale}/`,
      inLanguage: locale,
      publisher: { "@id": `${SITE_URL}/#business` },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      inLanguage: locale,
      mainEntity: messages.faq.items.map(({ question, answer }) => ({
        "@type": "Question",
        name: question,
        acceptedAnswer: {
          "@type": "Answer",
          text: answer,
        },
      })),
    },
  ];

  return (
    <>
      <a className="skip-link" href="#main">
        {messages.common.skipToContent}
      </a>
      <Header locale={locale} messages={messages} />

      <main id="main">
        <section
          className="hero"
          id="ballina"
          aria-labelledby="hero-title"
        >
          <div className="hero-panel">
            <p className="eyebrow">{messages.hero.eyebrow}</p>
            <h1 id="hero-title">{messages.hero.title}</h1>
            <p className="hero-intro">{messages.hero.description}</p>
            <div className="hero-actions">
              <a
                className="button"
                href={bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon name="whatsapp" size={18} />
                {messages.hero.primaryCta}
              </a>
              <a className="button button-quiet" href={BUSINESS.phoneHref}>
                <Icon name="phone" size={18} />
                {messages.hero.secondaryCta}
              </a>
            </div>
            <p className="trust-note">
              <Icon name="shield" size={18} />
              {messages.hero.trustLine}
            </p>
          </div>
          <div className="hero-image-wrap">
            <picture>
              <source
                srcSet={`${BUSINESS.heroImageMobile} 800w, ${BUSINESS.heroImage} 1280w`}
                sizes="(max-width: 980px) 100vw, 52vw"
              />
              <Image
                className="hero-image"
                src={BUSINESS.heroImage}
                alt={messages.hero.imageAlt}
                fill
                loading="eager"
                fetchPriority="high"
                sizes="(max-width: 980px) 100vw, 52vw"
              />
            </picture>
            <div className="image-wash" aria-hidden="true" />
            <Botanical className="hero-leaf" />
          </div>
        </section>

        <section
          className="trust section-shell"
          aria-labelledby="trust-title"
        >
          <div className="trust-copy">
            <p className="section-kicker">{messages.trust.kicker}</p>
            <h2 id="trust-title">{messages.trust.title}</h2>
            <p>{messages.trust.description}</p>
          </div>
          <div className="trust-image">
            <Image
              src="/images/hixhame-room-cups-900.webp"
              alt={messages.trust.imageAlt}
              fill
              loading="lazy"
              sizes="(max-width: 820px) 100vw, 52vw"
            />
          </div>
          <ol className="trust-list">
            {messages.trust.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </section>

        <section
          className="about section-shell"
          id="rreth-hixhames"
          aria-labelledby="about-title"
        >
          <div className="about-image">
            <Image
              src="/images/hixhame-cups-rose-900.webp"
              alt={messages.about.imageAlt}
              fill
              loading="lazy"
              sizes="(max-width: 820px) 100vw, 42vw"
            />
          </div>
          <div className="about-copy">
            <p className="section-kicker">{messages.about.kicker}</p>
            <h2 id="about-title">{messages.about.title}</h2>
            <p>{messages.about.paragraphOne}</p>
            <p>{messages.about.paragraphTwo}</p>
            <div className="about-detail">
              <Icon name="heart" size={20} />
              <span>{messages.about.detail}</span>
            </div>
          </div>
        </section>

        <section
          className="benefits section-shell"
          id="perfitimet"
          aria-labelledby="benefits-title"
        >
          <div className="benefits-intro">
            <p className="section-kicker">{messages.benefits.kicker}</p>
            <h2 id="benefits-title">{messages.benefits.title}</h2>
            <p>{messages.benefits.introduction}</p>
          </div>
          <div className="benefit-list">
            {messages.benefits.items.map((item, index) => (
              <article className="benefit-row" key={item.title}>
                <span className="benefit-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <Icon
                  name={benefitIcons[index]}
                  size={23}
                  strokeWidth={1.45}
                />
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              </article>
            ))}
          </div>
          <p className="disclaimer">{messages.benefits.disclaimer}</p>
        </section>

        <section
          className="process"
          id="si-realizohet"
          aria-labelledby="process-title"
        >
          <div className="section-shell">
            <div className="process-top">
              <p className="section-kicker">{messages.process.kicker}</p>
              <h2 id="process-title">{messages.process.title}</h2>
            </div>
            <div className="process-layout">
              <div className="process-steps">
                {messages.process.steps.map((step, index) => (
                  <ProcessStep
                    number={String(index + 1).padStart(2, "0")}
                    title={step.title}
                    copy={step.description}
                    key={step.title}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section
          className="care section-shell"
          aria-labelledby="care-title"
        >
          <div className="care-copy">
            <p className="section-kicker">{messages.privacy.kicker}</p>
            <h2 id="care-title">{messages.privacy.title}</h2>
            <p>{messages.privacy.description}</p>
            <ul>
              {messages.privacy.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="care-note">
            <Icon name="sparkle" size={28} />
            <p>{messages.privacy.note}</p>
            <a
              href={questionUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {messages.privacy.action}
              <Icon name="arrow" size={17} />
            </a>
          </div>
        </section>

        <Faq messages={messages.faq} questionUrl={questionUrl} />

        <section
          className="booking"
          id="kontakt"
          aria-labelledby="booking-title"
        >
          <Botanical className="booking-leaf" />
          <div className="section-shell booking-inner">
            <div>
              <p className="section-kicker">{messages.booking.kicker}</p>
              <h2 id="booking-title">{messages.booking.title}</h2>
              <p>{messages.booking.description}</p>
            </div>
            <div className="booking-actions">
              <a
                className="button button-light"
                href={bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon name="whatsapp" size={19} />
                {messages.booking.primaryCta}
              </a>
              <a className="phone-link" href={BUSINESS.phoneHref}>
                <Icon name="phone" size={19} />
                {BUSINESS.phoneDisplay}
              </a>
              <span>{messages.common.location}</span>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="section-shell footer-grid">
          <div className="footer-brand">
            <BrandLogo className="footer-logo-svg" loading="lazy" />
            <span className="footer-brand-statement">
              {messages.common.womenOnly}
            </span>
          </div>
          <div className="footer-column footer-contact">
            <h3>{messages.footer.contactTitle}</h3>
            <a href={BUSINESS.phoneHref}>{BUSINESS.phoneDisplay}</a>
            <span className="footer-location">
              {messages.common.location}
            </span>
            <a
              href={BUSINESS.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {BUSINESS.instagramHandle}
            </a>
          </div>
          <nav
            className="footer-column footer-navigation"
            aria-label={messages.footer.navigationTitle}
          >
            <h3>{messages.footer.navigationTitle}</h3>
            <a href={`/${locale}/#rreth-hixhames`}>
              {messages.footer.aboutLink}
            </a>
            <a href={`/${locale}/#perfitimet`}>
              {messages.footer.benefitsLink}
            </a>
            <a href={`/${locale}/#pyetje`}>
              {messages.footer.questionsLink}
            </a>
          </nav>
          <p className="footer-disclaimer">
            {messages.footer.disclaimer}
          </p>
        </div>
        <div className="footer-bottom">{messages.footer.copyright}</div>
      </footer>

      <div className="mobile-booking">
        <a href={BUSINESS.phoneHref}>
          <Icon name="phone" size={18} />
          {messages.hero.secondaryCta}
        </a>
        <a
          href={bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Icon name="whatsapp" size={18} />
          WhatsApp
        </a>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </>
  );
}

function ProcessStep({
  number,
  title,
  copy,
}: {
  number: string;
  title: string;
  copy: string;
}) {
  return (
    <article className="process-step">
      <span>{number}</span>
      <div>
        <h3>{title}</h3>
        <p>{copy}</p>
      </div>
    </article>
  );
}

function Botanical({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 220 270" aria-hidden="true">
      <path d="M17 258C75 208 98 146 104 25" />
      <path d="M102 61C75 60 56 45 48 25c27 1 45 13 54 36ZM96 105c-28 1-49-10-61-31 28-3 49 7 61 31ZM82 151c-27 5-49-2-64-21 27-6 49 0 64 21ZM70 191c-24 7-44 3-60-12 24-8 44-4 60 12Z" />
      <path d="M103 82c28-6 49-21 62-44-28 2-49 17-62 44ZM93 130c28-3 51-15 67-36-29-1-51 11-67 36ZM76 176c27 1 50-8 69-27-28-4-51 5-69 27Z" />
    </svg>
  );
}
