const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { chromium } = require("playwright-core");

const projectRoot = path.join(__dirname, "..");
const outputRoot = path.join(projectRoot, ".next-production");
const screenshotDir = path.join(projectRoot, "qa", "i18n");
const locales = ["sq", "en", "de", "fr", "tr", "it"];
const viewportMatrix = [
  { width: 320, height: 568 },
  { width: 360, height: 800 },
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1280, height: 900 },
  { width: 1440, height: 1000 },
  { width: 1920, height: 1080 },
];
const selectedLocales = process.env.QA_LOCALES
  ? process.env.QA_LOCALES.split(",").filter((locale) => locales.includes(locale))
  : locales;
const selectedViewports = process.env.QA_VIEWPORTS
  ? viewportMatrix.filter(({ width }) =>
      process.env.QA_VIEWPORTS.split(",").includes(String(width)),
    )
  : viewportMatrix;
const layoutOnly = process.env.QA_LAYOUT_ONLY === "1";
const skipMatrix = process.env.QA_SKIP_MATRIX === "1";
const fastMatrix = process.env.QA_FAST === "1";
const noScreenshots = process.env.QA_NO_SCREENSHOTS === "1";
const messages = Object.fromEntries(
  locales.map((locale) => [
    locale,
    JSON.parse(
      fs.readFileSync(path.join(projectRoot, "messages", `${locale}.json`), "utf8"),
    ),
  ]),
);
const chromeCandidates = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
];
const executablePath = chromeCandidates.find(fs.existsSync);
const externalBaseUrl = process.env.BASE_URL;
const port = Number(process.env.QA_PORT || 4317);
const baseUrl = externalBaseUrl || `http://127.0.0.1:${port}`;
const failures = [];
const results = [];
let server;

function check(condition, message) {
  if (!condition) failures.push(message);
}

function whatsappUrl(message) {
  return `https://wa.me/38345836605?text=${encodeURIComponent(message)}`;
}

async function waitForServer(url, attempts = 80) {
  for (let index = 0; index < attempts; index += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 125));
  }
  throw new Error(`Static server did not become ready at ${url}`);
}

async function startServer() {
  if (externalBaseUrl) return;
  server = spawn(
    process.execPath,
    [path.join(__dirname, "serve-static.cjs"), outputRoot, String(port)],
    {
      cwd: projectRoot,
      stdio: "ignore",
      windowsHide: true,
    },
  );
  await waitForServer(`${baseUrl}/sq/`);
}

function attachErrorCapture(page) {
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("requestfailed", (request) => {
    const failure = request.failure();
    errors.push(`${request.url()}: ${failure?.errorText || "request failed"}`);
  });
  return errors;
}

async function localeAudit(context, locale, viewport, screenshot = false) {
  const page = await context.newPage();
  await page.setViewportSize(viewport);
  const errors = attachErrorCapture(page);
  const url = `${baseUrl}/${locale}/`;
  await page.goto(url, { waitUntil: "networkidle" });
  const checkAllImages = !fastMatrix || screenshot;
  if (checkAllImages) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.evaluate(async () => {
      await Promise.all(
        [...document.images].map((image) => {
          if (image.complete) return Promise.resolve();
          return new Promise((resolve) => {
            image.addEventListener("load", resolve, { once: true });
            image.addEventListener("error", resolve, { once: true });
          });
        }),
      );
    });
    await page.evaluate(() => window.scrollTo(0, 0));
  }

  const expected = messages[locale];
  const expectedWhatsApp = whatsappUrl(expected.common.whatsappMessage);
  const expectedQuestion = whatsappUrl(expected.faq.whatsappMessage);
  const audit = await page.evaluate(
    ({ activeLocale, expectedCopy, albanianHeroTitle }) => {
      const visible = (element) => {
        if (!element) return false;
        const box = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return (
          box.width > 0 &&
          box.height > 0 &&
          style.visibility !== "hidden" &&
          style.display !== "none"
        );
      };
      const ids = [...document.querySelectorAll("[id]")].map((node) => node.id);
      const desktopLinks = [...document.querySelectorAll("[data-nav-link]")];
      const navTargets = desktopLinks.map((link) => {
        const hash = new URL(link.href).hash;
        return Boolean(hash && document.querySelector(hash));
      });
      const logo = [
        ...document.querySelectorAll(".brand-logo, .brand-logo-compact"),
      ]
        .find(visible)
        ?.getBoundingClientRect();
      const alternateLinks = [
        ...document.querySelectorAll('link[rel="alternate"][hreflang]'),
      ].map((link) => ({
        locale: link.getAttribute("hreflang"),
        href: link.getAttribute("href"),
      }));
      const images = [...document.images];
      const heroImage = document.querySelector(".hero-image");
      const header = document.querySelector(".site-header")?.getBoundingClientRect();
      const visibleControls = [
        ...document.querySelectorAll(
          "button, a.button, .mobile-booking a, [data-language-trigger]",
        ),
      ].filter(visible);
      const computed = (selector) => {
        const element = document.querySelector(selector);
        return element ? getComputedStyle(element) : null;
      };
      const functionalSelectors = [
        ".desktop-nav a",
        ".button",
        ".language-trigger",
        ".language-menu a",
        ".trust-list li",
        ".about-detail",
        ".benefit-row h3",
        ".benefit-row p",
        ".disclaimer",
        ".process-step > span",
        ".process-step h3",
        ".process-step p",
        ".care-copy li",
        ".care-note p",
        ".care-note a",
        ".faq-item button",
        ".faq-panel p",
        ".phone-link",
        ".booking-actions span",
        ".site-footer h3",
        ".site-footer a",
        ".footer-disclaimer",
        ".footer-bottom",
        ".mobile-nav > a:not(.button)",
        ".mobile-language-grid a",
      ];
      const functionalFontMismatches = functionalSelectors
        .map((selector) => ({
          selector,
          family: computed(selector)?.fontFamily || "",
        }))
        .filter(({ family }) => !family.includes("Manrope"));
      const displayFontMismatches = [...document.querySelectorAll("h1, h2")]
        .map((element) => ({
          text: element.textContent?.trim().slice(0, 60),
          family: getComputedStyle(element).fontFamily,
        }))
        .filter(({ family }) => !family.includes("Newsreader"));
      const smallParagraphs = [
        ...document.querySelectorAll(
          "p:not(.eyebrow):not(.section-kicker):not(.footer-brand-statement)",
        ),
      ]
        .filter(visible)
        .map((element) => ({
          text: element.textContent?.trim().slice(0, 60),
          size: Number.parseFloat(getComputedStyle(element).fontSize),
        }))
        .filter(({ size }) => size < 15);
      const weight300 = [...document.querySelectorAll("body *")]
        .filter(
          (element) =>
            visible(element) &&
            element.children.length === 0 &&
            element.textContent?.trim(),
        )
        .map((element) => ({
          text: element.textContent.trim().slice(0, 60),
          weight: Number.parseInt(getComputedStyle(element).fontWeight, 10),
        }))
        .filter(({ weight }) => Number.isFinite(weight) && weight < 400);
      const overflowElements = [...document.querySelectorAll("body *")]
        .map((element) => {
          const box = element.getBoundingClientRect();
          return {
            element: `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ""}${
              typeof element.className === "string" && element.className
                ? `.${element.className.trim().replace(/\s+/g, ".")}`
                : ""
            }`,
            left: Math.round(box.left),
            right: Math.round(box.right),
            width: Math.round(box.width),
            scrollWidth: element.scrollWidth,
            clientWidth: element.clientWidth,
          };
        })
        .filter(
          (item) =>
            item.left < -1 ||
            item.right > document.documentElement.clientWidth + 1 ||
            item.scrollWidth > item.clientWidth + 1,
        )
        .slice(0, 12);

      return {
        htmlLang: document.documentElement.lang,
        title: document.title,
        description: document
          .querySelector('meta[name="description"]')
          ?.getAttribute("content"),
        canonical: document
          .querySelector('link[rel="canonical"]')
          ?.getAttribute("href"),
        ogLocale: document
          .querySelector('meta[property="og:locale"]')
          ?.getAttribute("content"),
        alternateLinks,
        bodyContainsHero: document.body.innerText.includes(expectedCopy.hero.title),
        albanianCopyLeak:
          activeLocale !== "sq" &&
          document.body.innerText.includes(albanianHeroTitle),
        rawTranslationKeyVisible: /\b(hero|common|navigation|faq)\.[A-Za-z]/.test(
          document.body.innerText,
        ),
        overflow:
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth + 1,
        overflowElements,
        logoVisible: Boolean(
          logo &&
            logo.left >= 0 &&
            logo.right <= window.innerWidth + 1 &&
            logo.width > 0 &&
            logo.height > 0,
        ),
        headingVisible: visible(document.querySelector(".hero h1")),
        headingText: document.querySelector(".hero h1")?.textContent?.trim(),
        heroImageVisible: visible(heroImage),
        heroImageLoaded: Boolean(
          heroImage?.complete && heroImage?.naturalWidth > 0 && heroImage?.naturalHeight > 0,
        ),
        allImagesLoaded: images.every(
          (image) =>
            image.complete && image.naturalWidth > 0 && image.naturalHeight > 0,
        ),
        bookingHref: document
          .querySelector('.hero-actions a[href^="https://wa.me"]')
          ?.getAttribute("href"),
        phoneHref: document
          .querySelector('.hero-actions a[href^="tel:"]')
          ?.getAttribute("href"),
        instagramHref: document
          .querySelector('footer a[href*="instagram.com"]')
          ?.getAttribute("href"),
        statefulHref: document
          .querySelector("[data-stateful-question]")
          ?.getAttribute("data-href"),
        faqCount: document.querySelectorAll(".faq-item").length,
        validNavTargets: navTargets.every(Boolean),
        duplicateIds: ids.filter((id, index) => ids.indexOf(id) !== index),
        skipLink: document.querySelector(".skip-link")?.getAttribute("href"),
        themeToggleVisible: visible(document.querySelector("[data-theme-toggle]")),
        controlsFitViewport: visibleControls.every((control) => {
          const box = control.getBoundingClientRect();
          return box.left >= -1 && box.right <= window.innerWidth + 1;
        }),
        menuToggleVisible: visible(document.querySelector("[data-menu-toggle]")),
        desktopNavVisible: visible(document.querySelector(".desktop-nav")),
        headerHeight: Math.round(header?.height || 0),
        bodyFont: getComputedStyle(document.body).fontFamily,
        fontsReady:
          document.fonts.check("400 16px Manrope") &&
          document.fonts.check("500 64px Newsreader"),
        functionalFontMismatches,
        displayFontMismatches,
        smallParagraphs,
        weight300,
        footerLinkSize: Number.parseFloat(
          computed(".site-footer a")?.fontSize || "0",
        ),
        footerDisclaimerSize: Number.parseFloat(
          computed(".footer-disclaimer")?.fontSize || "0",
        ),
        footerBottomSize: Number.parseFloat(
          computed(".footer-bottom")?.fontSize || "0",
        ),
        activeLocale,
      };
    },
    {
      activeLocale: locale,
      expectedCopy: expected,
      albanianHeroTitle: messages.sq.hero.title,
    },
  );

  check(audit.htmlLang === locale, `${locale} ${viewport.width}: incorrect html lang`);
  check(
    audit.title === expected.metadata.title,
    `${locale} ${viewport.width}: incorrect title`,
  );
  check(
    audit.description === expected.metadata.description,
    `${locale} ${viewport.width}: incorrect description`,
  );
  check(
    audit.canonical === `https://hixhametina.com/${locale}/`,
    `${locale} ${viewport.width}: incorrect canonical`,
  );
  check(
    audit.alternateLinks.length === 7 &&
      audit.alternateLinks.some((link) => link.locale === "x-default"),
    `${locale} ${viewport.width}: hreflang set is incomplete`,
  );
  check(audit.bodyContainsHero, `${locale} ${viewport.width}: hero is not localized`);
  check(
    !audit.albanianCopyLeak,
    `${locale} ${viewport.width}: Albanian hero copy leaked into this locale`,
  );
  check(!audit.rawTranslationKeyVisible, `${locale} ${viewport.width}: raw i18n key visible`);
  check(
    !audit.overflow,
    `${locale} ${viewport.width}: horizontal overflow ${JSON.stringify(
      audit.overflowElements,
    )}`,
  );
  check(audit.logoVisible, `${locale} ${viewport.width}: logo is clipped or hidden`);
  check(audit.headingVisible, `${locale} ${viewport.width}: hero heading is hidden`);
  check(audit.heroImageVisible, `${locale} ${viewport.width}: hero image is hidden`);
  check(audit.heroImageLoaded, `${locale} ${viewport.width}: hero image did not load`);
  if (checkAllImages) {
    check(
      audit.allImagesLoaded,
      `${locale} ${viewport.width}: one or more images failed`,
    );
  }
  check(
    audit.bookingHref === expectedWhatsApp,
    `${locale} ${viewport.width}: WhatsApp booking URL is incorrect`,
  );
  check(
    audit.phoneHref === "tel:+38345836605",
    `${locale} ${viewport.width}: telephone URL is incorrect`,
  );
  check(
    audit.instagramHref === "https://www.instagram.com/hixhametina/",
    `${locale} ${viewport.width}: Instagram URL is incorrect`,
  );
  check(
    audit.statefulHref === expectedQuestion,
    `${locale} ${viewport.width}: localized FAQ WhatsApp URL is incorrect`,
  );
  check(audit.faqCount === 6, `${locale} ${viewport.width}: FAQ count is incorrect`);
  check(audit.validNavTargets, `${locale} ${viewport.width}: invalid navigation target`);
  check(
    audit.duplicateIds.length === 0,
    `${locale} ${viewport.width}: duplicate IDs ${audit.duplicateIds.join(", ")}`,
  );
  check(audit.skipLink === "#main", `${locale} ${viewport.width}: skip link is incorrect`);
  check(
    audit.themeToggleVisible,
    `${locale} ${viewport.width}: theme toggle is not visible`,
  );
  check(
    audit.controlsFitViewport,
    `${locale} ${viewport.width}: a visible control exceeds the viewport`,
  );
  check(
    viewport.width <= 1180 ? audit.menuToggleVisible : audit.desktopNavVisible,
    `${locale} ${viewport.width}: responsive navigation mode is incorrect`,
  );
  check(
    audit.bodyFont.includes("Manrope"),
    `${locale} ${viewport.width}: body font is ${audit.bodyFont}`,
  );
  check(
    audit.fontsReady,
    `${locale} ${viewport.width}: Manrope or Newsreader did not load`,
  );
  check(
    audit.functionalFontMismatches.length === 0,
    `${locale} ${viewport.width}: functional font mismatch ${JSON.stringify(
      audit.functionalFontMismatches,
    )}`,
  );
  check(
    audit.displayFontMismatches.length === 0,
    `${locale} ${viewport.width}: display font mismatch ${JSON.stringify(
      audit.displayFontMismatches,
    )}`,
  );
  check(
    audit.smallParagraphs.length === 0,
    `${locale} ${viewport.width}: paragraph below 15px ${JSON.stringify(
      audit.smallParagraphs,
    )}`,
  );
  check(
    audit.weight300.length === 0,
    `${locale} ${viewport.width}: readable text below weight 400 ${JSON.stringify(
      audit.weight300,
    )}`,
  );
  check(
    audit.footerLinkSize >= 15 &&
      audit.footerDisclaimerSize >= 14 &&
      audit.footerBottomSize >= 14,
    `${locale} ${viewport.width}: footer typography is below minimum size`,
  );
  if (screenshot && !noScreenshots) {
    await page.screenshot({
      path: path.join(
        screenshotDir,
        `${locale}-${viewport.width}x${viewport.height}.png`,
      ),
      fullPage: true,
    });
  }

  if (viewport.width === 390) {
    const menuToggle = page.locator("[data-menu-toggle]");
    await menuToggle.click();
    check(
      (await menuToggle.getAttribute("aria-expanded")) === "true",
      `${locale} mobile menu did not open`,
    );
    check(
      (await page.locator(".mobile-language-grid a").count()) === 6,
      `${locale} mobile language selector is incomplete`,
    );
    await page.keyboard.press("Escape");
    check(
      (await menuToggle.getAttribute("aria-expanded")) === "false",
      `${locale} mobile menu did not close with Escape`,
    );
    const faqButton = page.locator(".faq-item button").first();
    await faqButton.click();
    check(
      (await faqButton.getAttribute("aria-expanded")) === "true",
      `${locale} FAQ did not open`,
    );
  }

  if (viewport.width === 1440) {
    const trigger = page.locator("[data-language-trigger]");
    await trigger.click();
    check(
      (await trigger.getAttribute("aria-expanded")) === "true",
      `${locale} desktop language selector did not open by mouse`,
    );
    check(
      (await page.locator('[role="menuitemradio"]').count()) === 6,
      `${locale} desktop language selector is incomplete`,
    );
    await page.keyboard.press("Escape");
  }

  check(errors.length === 0, `${locale} ${viewport.width}: ${errors.join(" | ")}`);
  results.push({
    locale,
    viewport: `${viewport.width}x${viewport.height}`,
    overflow: audit.overflow,
    errors: errors.length,
  });
  await page.close();
}

async function interactionAudit(browser) {
  const desktop = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  const desktopErrors = attachErrorCapture(desktop);
  await desktop.goto(`${baseUrl}/en/`, { waitUntil: "networkidle" });

  const languageTrigger = desktop.locator("[data-language-trigger]");
  await languageTrigger.focus();
  await desktop.keyboard.press("ArrowDown");
  check(
    (await languageTrigger.getAttribute("aria-expanded")) === "true",
    "Desktop language selector did not open from keyboard",
  );
  check(
    (await desktop.locator('[role="menuitemradio"]').count()) === 6,
    "Desktop language selector does not contain six options",
  );
  check(
    (await desktop.locator('[role="menuitemradio"][aria-checked="true"]').count()) === 1,
    "Desktop language selector does not mark exactly one current locale",
  );
  await desktop.keyboard.press("Escape");
  check(
    (await languageTrigger.getAttribute("aria-expanded")) === "false",
    "Desktop language selector did not close with Escape",
  );
  await languageTrigger.focus();
  await desktop.keyboard.press("Enter");
  check(
    (await languageTrigger.getAttribute("aria-expanded")) === "true",
    "Desktop language selector did not open with Enter",
  );
  await desktop.keyboard.press("Escape");
  await languageTrigger.focus();
  await desktop.keyboard.press("Space");
  check(
    (await languageTrigger.getAttribute("aria-expanded")) === "true",
    "Desktop language selector did not open with Space",
  );
  await desktop.locator(".hero-panel").click({ position: { x: 8, y: 8 } });
  check(
    (await languageTrigger.getAttribute("aria-expanded")) === "false",
    "Desktop language selector did not close after clicking outside",
  );

  const themeToggle = desktop.locator("[data-theme-toggle]");
  await themeToggle.click();
  check(
    (await desktop.locator("html").getAttribute("data-theme")) === "dark",
    "Theme toggle did not activate dark mode",
  );
  await desktop.reload({ waitUntil: "networkidle" });
  check(
    (await desktop.locator("html").getAttribute("data-theme")) === "dark",
    "Theme selection did not persist after reload",
  );
  await themeToggle.click();

  const faqButton = desktop.locator(".faq-item button").first();
  await faqButton.focus();
  await desktop.keyboard.press("Enter");
  check(
    (await faqButton.getAttribute("aria-expanded")) === "true",
    "FAQ did not open with keyboard",
  );

  await desktop.goto(`${baseUrl}/en/#pyetje`, { waitUntil: "networkidle" });
  await desktop.locator("[data-language-trigger]").click();
  await Promise.all([
    desktop.waitForURL(/\/de\/?#pyetje$/),
    desktop.locator('[data-locale-link="de"]').first().click(),
  ]);
  const localeCookie = await desktop.context().cookies();
  check(
    localeCookie.some(
      (cookie) => cookie.name === "ht_locale" && cookie.value === "de",
    ),
    "Locale selector did not persist the German locale cookie",
  );
  check(
    (await desktop.locator("html").getAttribute("lang")) === "de",
    "Locale selector did not navigate to the German page",
  );
  check(desktopErrors.length === 0, `Desktop interactions: ${desktopErrors.join(" | ")}`);
  await desktop.close();

  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
  });
  const mobileErrors = attachErrorCapture(mobile);
  await mobile.goto(`${baseUrl}/tr/`, { waitUntil: "networkidle" });
  const menuToggle = mobile.locator("[data-menu-toggle]");
  await menuToggle.click();
  check(
    (await menuToggle.getAttribute("aria-expanded")) === "true",
    "Mobile menu did not open",
  );
  check(
    (await mobile.locator(".mobile-language-grid a").count()) === 6,
    "Mobile menu does not contain six language options",
  );
  check(
    await mobile.locator("body").evaluate((body) => body.classList.contains("menu-open")),
    "Body scrolling was not locked while the mobile menu was open",
  );
  await mobile.keyboard.press("Escape");
  check(
    (await menuToggle.getAttribute("aria-expanded")) === "false",
    "Mobile menu did not close with Escape",
  );
  check(
    await menuToggle.evaluate((button) => button === document.activeElement),
    "Focus did not return to the mobile menu trigger",
  );

  await mobile.evaluate(() => {
    window.open = () => null;
  });
  const questionButton = mobile.locator("[data-stateful-question]");
  await questionButton.click();
  check(
    (await questionButton.getAttribute("data-state")) === "loading",
    "Stateful FAQ button did not enter loading state",
  );
  await mobile.waitForTimeout(760);
  check(
    (await questionButton.getAttribute("data-state")) === "success",
    "Stateful FAQ button did not enter success state",
  );
  check(mobileErrors.length === 0, `Mobile interactions: ${mobileErrors.join(" | ")}`);
  await mobile.close();
}

async function redirectAudit(browser) {
  for (const [browserLocale, cookieLocale, expectedLocale] of [
    ["de-DE", null, "de"],
    ["en-US", "fr", "fr"],
    ["es-ES", null, "sq"],
  ]) {
    const context = await browser.newContext({ locale: browserLocale });
    if (cookieLocale) {
      await context.addCookies([
        {
          name: "ht_locale",
          value: cookieLocale,
          url: baseUrl,
          sameSite: "Lax",
        },
      ]);
    }
    const page = await context.newPage();
    await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
    check(
      new URL(page.url()).pathname === `/${expectedLocale}/`,
      `Root redirect failed for ${browserLocale} with cookie ${cookieLocale || "none"}`,
    );
    await context.close();
  }
}

async function staticSeoAudit() {
  const sitemap = await (await fetch(`${baseUrl}/sitemap.xml`)).text();
  const robots = await (await fetch(`${baseUrl}/robots.txt`)).text();
  for (const locale of locales) {
    check(
      sitemap.includes(`https://hixhametina.com/${locale}`),
      `Sitemap is missing ${locale}`,
    );
  }
  check(
    sitemap.includes('hreflang="x-default"'),
    "Sitemap is missing x-default hreflang",
  );
  check(
    robots.includes("https://hixhametina.com/sitemap.xml"),
    "Robots file has an incorrect sitemap URL",
  );
}

async function notFoundAudit(browser) {
  for (const locale of locales) {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
    });
    const errors = attachErrorCapture(page);
    const response = await page.goto(`${baseUrl}/${locale}/missing-page/`, {
      waitUntil: "networkidle",
    });
    await page.waitForFunction(
      (activeLocale) => document.documentElement.lang === activeLocale,
      locale,
    );
    check(response?.status() === 404, `${locale} 404 did not return status 404`);
    check(
      (await page.locator("[data-not-found-title]").textContent()) ===
        messages[locale].notFound.title,
      `${locale} 404 title is not localized`,
    );
    check(
      (await page.locator("[data-not-found-action]").getAttribute("href")) ===
        `/${locale}/`,
      `${locale} 404 action points to the wrong locale`,
    );
    if (locale === "sq" || locale === "de") {
      await page.screenshot({
        path: path.join(screenshotDir, `404-${locale}-390x844.png`),
        fullPage: true,
      });
    }
    const unexpectedErrors = errors.filter(
      (error) => !error.includes("server responded with a status of 404"),
    );
    check(
      unexpectedErrors.length === 0,
      `${locale} 404: ${unexpectedErrors.join(" | ")}`,
    );
    await page.close();
  }
}

async function main() {
  fs.mkdirSync(screenshotDir, { recursive: true });
  check(Boolean(executablePath), "Chrome or Edge executable was not found");
  if (!executablePath) throw new Error(failures[0]);
  await startServer();
  const browser = await chromium.launch({ headless: true, executablePath });

  try {
    const auditContext = await browser.newContext();
    if (!skipMatrix) {
      for (const locale of selectedLocales) {
        for (const viewport of selectedViewports) {
          const screenshot =
            (viewport.width === 390 && viewport.height === 844) ||
            (viewport.width === 1440 && viewport.height === 1000);
          await localeAudit(auditContext, locale, viewport, screenshot);
        }
      }
    }
    await auditContext.close();
    if (!layoutOnly) {
      await interactionAudit(browser);
      await redirectAudit(browser);
      await staticSeoAudit();
      await notFoundAudit(browser);
    }
  } finally {
    await browser.close();
    if (server) server.kill();
  }

  const report = {
    checkedPages: results.length,
    locales: selectedLocales,
    viewports: selectedViewports.map(
      ({ width, height }) => `${width}x${height}`,
    ),
    screenshots: fs
      .readdirSync(screenshotDir)
      .filter((file) => file.endsWith(".png"))
      .sort(),
    failures,
  };
  fs.writeFileSync(
    path.join(
      screenshotDir,
      externalBaseUrl ? "report-live.json" : "report.json",
    ),
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
  if (failures.length) process.exit(1);
}

main().catch((error) => {
  if (server) server.kill();
  console.error(error);
  process.exit(1);
});
