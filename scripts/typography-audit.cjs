const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { chromium } = require("playwright-core");

const projectRoot = path.join(__dirname, "..");
const outputRoot = path.join(projectRoot, ".next-production");
const reportDir = path.join(projectRoot, "qa", "typography", "after");
const port = Number(process.env.TYPOGRAPHY_AUDIT_PORT || 4324);
const baseUrl = `http://127.0.0.1:${port}`;
const locales = {
  sq: "ë Ë ç Ç",
  en: "ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz",
  de: "ä ö ü Ä Ö Ü ß",
  fr: "é è ê ë à â ç œ",
  tr: "ç ğ ı İ ö ş ü",
  it: "à è é ì ò ù",
};
const browserCandidates = [
  {
    name: "Chrome",
    path: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  },
  {
    name: "Chrome",
    path: "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  },
  {
    name: "Edge",
    path: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  },
  {
    name: "Edge",
    path: "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  },
].filter((browser, index, values) => {
  return (
    fs.existsSync(browser.path) &&
    values.findIndex((candidate) => candidate.name === browser.name) === index
  );
});
let server;

async function waitForServer(attempts = 80) {
  for (let index = 0; index < attempts; index += 1) {
    try {
      const response = await fetch(`${baseUrl}/sq/`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 125));
  }
  throw new Error(`Static server did not become ready at ${baseUrl}`);
}

function parseRgb(value) {
  const channels = value.match(/[\d.]+/g)?.map(Number) || [];
  return channels.slice(0, 3);
}

function luminance(color) {
  const [red, green, blue] = parseRgb(color).map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(foreground, background) {
  const light = Math.max(luminance(foreground), luminance(background));
  const dark = Math.min(luminance(foreground), luminance(background));
  return (light + 0.05) / (dark + 0.05);
}

function captureErrors(page) {
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("requestfailed", (request) => {
    errors.push(
      `${request.url()}: ${request.failure()?.errorText || "request failed"}`,
    );
  });
  return errors;
}

async function inspectLocale(browser, locale, glyphs) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  const errors = captureErrors(page);
  await page.goto(`${baseUrl}/${locale}/`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);

  const metrics = await page.evaluate(
    ({ expectedLocale }) => {
      const style = (selector) => {
        const element = document.querySelector(selector);
        if (!element) return null;
        const computed = getComputedStyle(element);
        return {
          family: computed.fontFamily,
          size: Number.parseFloat(computed.fontSize),
          weight: Number.parseInt(computed.fontWeight, 10),
          lineHeight: computed.lineHeight,
        };
      };
      const fontResources = performance
        .getEntriesByType("resource")
        .filter((entry) => /\.woff2(?:$|\?)/.test(entry.name))
        .map((entry) => ({
          file: new URL(entry.name).pathname.split("/").pop(),
          transferSize: entry.transferSize,
          encodedBodySize: entry.encodedBodySize,
          decodedBodySize: entry.decodedBodySize,
        }));
      return {
        locale: expectedLocale,
        documentLanguage: document.documentElement.lang,
        bodyFont: style("body"),
        heroFont: style("h1"),
        sectionFont: style("h2"),
        navigationFont: style(".desktop-nav a"),
        buttonFont: style(".button"),
        faqQuestionFont: style(".faq-item button"),
        faqAnswerFont: style(".faq-panel p"),
        footerLinkFont: style(".site-footer a"),
        footerDisclaimerFont: style(".footer-disclaimer"),
        footerBottomFont: style(".footer-bottom"),
        overflow:
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth,
        fontResources,
      };
    },
    { expectedLocale: locale },
  );
  const glyphReadiness = await page.evaluate(async (sample) => {
    await Promise.all([
      document.fonts.load("400 16px Manrope", sample),
      document.fonts.load("500 64px Newsreader", sample),
    ]);
    return {
      manropeGlyphsReady: document.fonts.check("400 16px Manrope", sample),
      newsreaderGlyphsReady: document.fonts.check("500 64px Newsreader", sample),
    };
  }, glyphs);

  await context.close();
  return { ...metrics, ...glyphReadiness, errors };
}

async function inspectContrast(browser, theme) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  await page.goto(`${baseUrl}/sq/`, { waitUntil: "networkidle" });
  await page.evaluate((nextTheme) => {
    document.documentElement.dataset.theme = nextTheme;
  }, theme);

  const pairs = await page.evaluate(() => {
    const selectors = [
      ".site-footer h3",
      ".site-footer a",
      ".footer-location",
      ".footer-disclaimer",
      ".footer-bottom",
      ".booking .section-kicker",
      ".booking h2",
      ".booking p:not(.section-kicker)",
      ".booking-actions span",
      ".phone-link",
      ".button-light",
    ];
    const backgroundFor = (element) => {
      let current = element;
      while (current) {
        const background = getComputedStyle(current).backgroundColor;
        const alpha = Number.parseFloat(background.match(/[\d.]+/g)?.[3] || "1");
        if (background !== "rgba(0, 0, 0, 0)" && alpha > 0) return background;
        current = current.parentElement;
      }
      return getComputedStyle(document.body).backgroundColor;
    };
    return selectors.map((selector) => {
      const element = document.querySelector(selector);
      const computed = getComputedStyle(element);
      return {
        selector,
        foreground: computed.color,
        background: backgroundFor(element),
        size: Number.parseFloat(computed.fontSize),
        weight: Number.parseInt(computed.fontWeight, 10),
      };
    });
  });
  await context.close();

  return pairs.map((pair) => {
    const ratio = contrastRatio(pair.foreground, pair.background);
    const largeText = pair.size >= 24 || (pair.size >= 18.66 && pair.weight >= 700);
    const required = largeText ? 3 : 4.5;
    return {
      ...pair,
      ratio: Number(ratio.toFixed(2)),
      required,
      pass: ratio >= required,
    };
  });
}

async function inspectReflow(browser) {
  const context = await browser.newContext({
    viewport: { width: 720, height: 900 },
  });
  const page = await context.newPage();
  const errors = captureErrors(page);
  await page.goto(`${baseUrl}/sq/`, { waitUntil: "networkidle" });
  const result = await page.evaluate(() => {
    const elements = [...document.querySelectorAll("h1, h2, h3, p, a, button")]
      .filter((element) => {
        const box = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return (
          box.width > 0 &&
          box.height > 0 &&
          style.display !== "none" &&
          style.visibility !== "hidden"
        );
      })
      .map((element) => {
        const box = element.getBoundingClientRect();
        return {
          tag: element.tagName,
          text: element.textContent?.trim().slice(0, 60),
          left: box.left,
          right: box.right,
        };
      });
    return {
      effectiveViewportWidth: innerWidth,
      horizontalOverflow:
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
      clippedText: elements.filter(
        (element) => element.left < -1 || element.right > innerWidth + 1,
      ),
    };
  });
  await context.close();
  return { ...result, errors };
}

async function inspectBrowser(candidate) {
  const browser = await chromium.launch({
    headless: true,
    executablePath: candidate.path,
  });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  const errors = captureErrors(page);
  await page.goto(`${baseUrl}/sq/`, { waitUntil: "networkidle" });
  const result = await page.evaluate(() => ({
    bodyFont: getComputedStyle(document.body).fontFamily,
    heroFont: getComputedStyle(document.querySelector("h1")).fontFamily,
    fontsReady:
      document.fonts.check("400 16px Manrope") &&
      document.fonts.check("500 52px Newsreader"),
    overflow:
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  }));
  await context.close();
  await browser.close();
  return { browser: candidate.name, ...result, errors };
}

async function captureScreenshots(browser) {
  const targets = [
    { name: "desktop-1440", width: 1440, height: 1000 },
    { name: "mobile-390", width: 390, height: 844 },
  ];

  for (const target of targets) {
    const context = await browser.newContext({
      viewport: { width: target.width, height: target.height },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    await page.goto(`${baseUrl}/sq/`, { waitUntil: "networkidle" });
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
      window.scrollTo(0, 0);
    });
    await page.screenshot({
      path: path.join(reportDir, `${target.name}-full.png`),
      fullPage: true,
    });
    await page.addStyleTag({ content: ".mobile-booking{display:none!important}" });
    await page.locator(".site-footer").screenshot({
      path: path.join(reportDir, `${target.name}-footer.png`),
    });
    await page.locator(".theme-toggle").click();
    await page.waitForTimeout(250);
    await page.screenshot({
      path: path.join(reportDir, `${target.name}-dark.png`),
      fullPage: true,
    });
    await context.close();
  }
}

async function main() {
  if (!browserCandidates.length) {
    throw new Error("Chrome or Edge was not found.");
  }
  fs.mkdirSync(reportDir, { recursive: true });
  server = spawn(
    process.execPath,
    [path.join(__dirname, "serve-static.cjs"), outputRoot, String(port)],
    {
      cwd: projectRoot,
      stdio: "ignore",
      windowsHide: true,
    },
  );
  await waitForServer();

  const chromeCandidate =
    browserCandidates.find((candidate) => candidate.name === "Chrome") ||
    browserCandidates[0];
  const browser = await chromium.launch({
    headless: true,
    executablePath: chromeCandidate.path,
  });

  try {
    const localeResults = [];
    for (const [locale, glyphs] of Object.entries(locales)) {
      localeResults.push(await inspectLocale(browser, locale, glyphs));
    }
    const contrast = {
      light: await inspectContrast(browser, "light"),
      dark: await inspectContrast(browser, "dark"),
    };
    const reflow = await inspectReflow(browser);
    await captureScreenshots(browser);
    await browser.close();

    const browsers = [];
    for (const candidate of browserCandidates) {
      browsers.push(await inspectBrowser(candidate));
    }

    const firstLocaleFonts = localeResults[0].fontResources;
    const fontMetrics = {
      requestCount: firstLocaleFonts.length,
      transferBytes: firstLocaleFonts.reduce(
        (total, resource) => total + resource.transferSize,
        0,
      ),
      encodedBytes: firstLocaleFonts.reduce(
        (total, resource) => total + resource.encodedBodySize,
        0,
      ),
      resources: firstLocaleFonts,
      locales: localeResults,
    };
    const failures = [
      ...localeResults.flatMap((result) => {
        const problems = [];
        if (result.documentLanguage !== result.locale) {
          problems.push(`${result.locale}: incorrect document language`);
        }
        if (!result.bodyFont?.family.includes("Manrope")) {
          problems.push(`${result.locale}: body is not Manrope`);
        }
        if (!result.heroFont?.family.includes("Newsreader")) {
          problems.push(`${result.locale}: hero is not Newsreader`);
        }
        if (!result.manropeGlyphsReady || !result.newsreaderGlyphsReady) {
          problems.push(`${result.locale}: required glyphs are not ready`);
        }
        const uniqueFontFiles = new Set(
          result.fontResources.map((resource) => resource.file),
        );
        if (
          uniqueFontFiles.size !== result.fontResources.length ||
          ![2, 4].includes(result.fontResources.length)
        ) {
          problems.push(
            `${result.locale}: unexpected or duplicated font requests`,
          );
        }
        if (result.overflow) problems.push(`${result.locale}: horizontal overflow`);
        return [...problems, ...result.errors];
      }),
      ...Object.entries(contrast).flatMap(([theme, pairs]) =>
        pairs
          .filter((pair) => !pair.pass)
          .map(
            (pair) =>
              `${theme} ${pair.selector}: ${pair.ratio}:1, required ${pair.required}:1`,
          ),
      ),
      ...(reflow.horizontalOverflow
        ? ["200% zoom equivalent: horizontal overflow"]
        : []),
      ...reflow.clippedText.map(
        (item) => `200% zoom equivalent: clipped ${item.tag} "${item.text}"`,
      ),
      ...reflow.errors,
      ...browsers.flatMap((result) => {
        const problems = [];
        if (!result.bodyFont.includes("Manrope")) {
          problems.push(`${result.browser}: body is not Manrope`);
        }
        if (!result.heroFont.includes("Newsreader")) {
          problems.push(`${result.browser}: hero is not Newsreader`);
        }
        if (!result.fontsReady) problems.push(`${result.browser}: fonts not ready`);
        if (result.overflow) problems.push(`${result.browser}: horizontal overflow`);
        return [...problems, ...result.errors];
      }),
    ];
    const report = {
      fontMetrics,
      contrast,
      reflow,
      browsers,
      unavailableBrowsers: [
        "Safari is not available on Windows.",
        ...(browserCandidates.some((candidate) => candidate.name === "Edge")
          ? []
          : ["Edge was not found on this machine."]),
        "Firefox is not installed in the project test runtime.",
      ],
      failures,
    };

    fs.writeFileSync(
      path.join(reportDir, "font-metrics.json"),
      JSON.stringify(fontMetrics, null, 2),
    );
    fs.writeFileSync(
      path.join(reportDir, "contrast.json"),
      JSON.stringify(contrast, null, 2),
    );
    fs.writeFileSync(
      path.join(reportDir, "browser-checks.json"),
      JSON.stringify(
        {
          browsers,
          reflow,
          unavailableBrowsers: report.unavailableBrowsers,
        },
        null,
        2,
      ),
    );
    fs.writeFileSync(
      path.join(reportDir, "typography-audit.json"),
      JSON.stringify(report, null, 2),
    );
    console.log(JSON.stringify(report, null, 2));
    if (failures.length) process.exitCode = 1;
  } finally {
    if (browser.isConnected()) await browser.close();
    server.kill();
  }
}

main().catch((error) => {
  if (server) server.kill();
  console.error(error);
  process.exit(1);
});
