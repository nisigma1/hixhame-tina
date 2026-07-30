const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.join(__dirname, "..");
const locales = ["sq", "en", "de", "fr", "tr", "it"];
const messageDir = path.join(projectRoot, "messages");

const expectedWhatsApp = {
  sq: "Përshëndetje, dëshiroj të rezervoj një termin te Hixhame Tina.",
  en: "Hello, I would like to book an appointment at Hixhame Tina.",
  de: "Hallo, ich möchte einen Termin bei Hixhame Tina buchen.",
  fr: "Bonjour, je souhaite réserver un rendez-vous chez Hixhame Tina.",
  tr: "Merhaba, Hixhame Tina’da randevu almak istiyorum.",
  it: "Buongiorno, vorrei prenotare un appuntamento presso Hixhame Tina.",
};

const requiredTerms = {
  sq: ["Hixhame", "Terapia me kupa", "Vetëm për femra"],
  en: ["Hijama", "Cupping therapy", "Women only"],
  de: ["Hijama", "Schröpftherapie", "Nur für Frauen"],
  fr: ["Hijama", "Thérapie par ventouses", "Réservé aux femmes"],
  tr: ["Hacamat", "Kupa terapisi", "Sadece kadınlara özel"],
  it: ["Hijama", "Coppettazione", "Solo per donne"],
};

const unsafeBenefitClaims = {
  sq: /\b(shëron|kuron|garanton|detoksifikon|eliminon toksinat)\b/i,
  en: /\b(cures?|heals?|guarantees?|detox(?:es|ifies)?)\b/i,
  de: /\b(heilt|garantiert|entgiftet)\b/i,
  fr: /\b(guérit|soigne|garantit|détoxifie)\b/i,
  tr: /\b(iyileştirir|tedavi eder|garanti eder|detoks yapar)\b/i,
  it: /\b(guarisce|garantisce|disintossica)\b/i,
};

const forbiddenMojibake = /(?:\uFFFD|Ã.|Â.|â€|Ä±|ÅŸ|Åž|ÄŸ|Äž)/;
const errors = [];

function load(locale) {
  const file = path.join(messageDir, `${locale}.json`);
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    errors.push(`${locale}: invalid JSON (${error.message})`);
    return {};
  }
}

function collectShape(value, currentPath = "", output = new Map()) {
  if (Array.isArray(value)) {
    output.set(currentPath, `array:${value.length}`);
    value.forEach((item, index) =>
      collectShape(item, `${currentPath}[${index}]`, output),
    );
    return output;
  }

  if (value && typeof value === "object") {
    output.set(currentPath, "object");
    for (const [key, item] of Object.entries(value)) {
      collectShape(item, currentPath ? `${currentPath}.${key}` : key, output);
    }
    return output;
  }

  output.set(currentPath, typeof value);
  return output;
}

function collectStrings(value, currentPath = "", output = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      collectStrings(item, `${currentPath}[${index}]`, output),
    );
    return output;
  }

  if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      collectStrings(item, currentPath ? `${currentPath}.${key}` : key, output);
    }
    return output;
  }

  if (typeof value === "string") output.push([currentPath, value]);
  return output;
}

const messages = Object.fromEntries(locales.map((locale) => [locale, load(locale)]));
const referenceShape = collectShape(messages.sq);

for (const locale of locales) {
  const localeShape = collectShape(messages[locale]);
  const allShapePaths = new Set([...referenceShape.keys(), ...localeShape.keys()]);

  for (const shapePath of allShapePaths) {
    const expected = referenceShape.get(shapePath);
    const actual = localeShape.get(shapePath);
    if (expected !== actual) {
      errors.push(
        `${locale}:${shapePath || "<root>"} has shape ${actual || "missing"}; expected ${expected}`,
      );
    }
  }

  const strings = collectStrings(messages[locale]);
  const fullText = strings.map(([, value]) => value).join("\n");

  for (const [key, value] of strings) {
    if (!value.trim()) errors.push(`${locale}:${key} is empty`);
    if (value !== value.trim()) errors.push(`${locale}:${key} has outer whitespace`);
    if (forbiddenMojibake.test(value)) errors.push(`${locale}:${key} contains mojibake`);
    if (/\{\{?[\w.-]+\}?\}/.test(value)) {
      errors.push(`${locale}:${key} appears to expose a raw translation key`);
    }
  }

  for (const term of requiredTerms[locale]) {
    if (!fullText.toLocaleLowerCase(locale).includes(term.toLocaleLowerCase(locale))) {
      errors.push(`${locale}: required terminology is missing: "${term}"`);
    }
  }

  if (messages[locale]?.common?.whatsappMessage !== expectedWhatsApp[locale]) {
    errors.push(`${locale}: booking WhatsApp message does not match the approved copy`);
  }

  const benefitText = (messages[locale]?.benefits?.items || [])
    .map(({ title, description }) => `${title} ${description}`)
    .join("\n");
  if (unsafeBenefitClaims[locale].test(benefitText)) {
    errors.push(`${locale}: benefits contain an absolute or unsafe medical claim`);
  }

  const intro = messages[locale]?.benefits?.introduction || "";
  const footerDisclaimer = messages[locale]?.footer?.disclaimer || "";
  const safetyMarkers = {
    sq: ["nuk zëvendëson", "diagnoz", "trajtim"],
    en: ["does not replace", "diagnosis", "treatment"],
    de: ["ersetzt keine", "Diagnose", "Behandlung"],
    fr: ["ne remplace", "diagnostic", "traitement"],
    tr: ["yerini almaz", "tanı", "tedavi"],
    it: ["non sostituisce", "diagnosi", "trattamento"],
  };
  for (const marker of safetyMarkers[locale]) {
    if (
      !`${intro}\n${footerDisclaimer}`
        .toLocaleLowerCase(locale)
        .includes(marker.toLocaleLowerCase(locale))
    ) {
      errors.push(`${locale}: medical disclaimer is missing "${marker}"`);
    }
  }

  const titleLength = [...(messages[locale]?.metadata?.title || "")].length;
  const descriptionLength = [
    ...(messages[locale]?.metadata?.description || ""),
  ].length;
  if (titleLength < 30 || titleLength > 65) {
    errors.push(`${locale}: metadata title length is ${titleLength}, expected 30-65`);
  }
  if (descriptionLength < 110 || descriptionLength > 165) {
    errors.push(
      `${locale}: metadata description length is ${descriptionLength}, expected 110-165`,
    );
  }
}

if (errors.length) {
  console.error(`i18n audit failed with ${errors.length} issue(s):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(
  `i18n audit passed: ${locales.length} locales, ${referenceShape.size} structural entries, approved terminology and medical-safety checks.`,
);
