const { chromium } = require("playwright-core");

const whatsapp =
  "https://wa.me/38345836605?text=P%C3%ABrsh%C3%ABndetje%2C%20d%C3%ABshiroj%20t%C3%AB%20rezervoj%20nj%C3%AB%20termin%20te%20Hixhame%20Tina.";

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("https://hixhametina.com/sq/", { waitUntil: "networkidle" });
  const base = await page.evaluate((expectedWhatsApp) => ({
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    whatsappOk: document.querySelector('.hero-actions a[href^="https://wa.me"]')?.getAttribute("href") === expectedWhatsApp,
    phoneOk: document.querySelector('.hero-actions a[href^="tel:"]')?.getAttribute("href") === "tel:+38345836605",
    instagramOk:
      document.querySelector('footer a[href*="instagram.com"]')?.getAttribute("href") ===
      "https://www.instagram.com/hixhametina/",
  }), whatsapp);

  await page.click(".menu-toggle");
  await page.waitForTimeout(80);
  const menuOpen = await page.evaluate(
    () =>
      document.querySelector(".menu-toggle")?.getAttribute("aria-expanded") === "true" &&
      !document.querySelector("#mobile-menu")?.hasAttribute("hidden"),
  );
  await page.keyboard.press("Escape");
  await page.waitForTimeout(80);
  const menuClosed = await page.evaluate(
    () =>
      document.querySelector(".menu-toggle")?.getAttribute("aria-expanded") === "false" &&
      document.querySelector("#mobile-menu")?.hasAttribute("hidden"),
  );

  await page.goto("https://hixhametina.com/sq/#pyetje", {
    waitUntil: "networkidle",
  });
  await page.click(".faq-item button");
  await page.waitForTimeout(80);
  const faqOk = await page.evaluate(
    () =>
      document.querySelector(".faq-item button")?.getAttribute("aria-expanded") === "true" &&
      !document.querySelector(".faq-panel")?.hasAttribute("hidden"),
  );

  await browser.close();
  const result = { errors, ...base, menuOpen, menuClosed, faqOk };
  console.log(JSON.stringify(result, null, 2));
  if (
    errors.length ||
    !base.whatsappOk ||
    !base.phoneOk ||
    !base.instagramOk ||
    base.overflow ||
    !menuOpen ||
    !menuClosed ||
    !faqOk
  ) {
    process.exit(1);
  }
})();
