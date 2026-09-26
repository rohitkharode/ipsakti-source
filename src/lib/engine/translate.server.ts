import { generateText } from "@/lib/llm/provider.server";
import type { LanguageCode, Product } from "@/types/domain";


/**
 * TranslationService — provider abstraction.
 *
 * English is the canonical reasoning representation: user input is normalised to
 * English before classification and retrieval, and the generated explanation is
 * translated back into the user language. Source evidence is NEVER translated
 * before validation; the original citation always remains authoritative.
 */

/** Identifiers that must survive translation untouched. */
const PROTECTED_PATTERNS: RegExp[] = [
  /https?:\/\/\S+/g, // urls
  /\b[A-Z]{2,}[A-Z0-9-]*-\d[\w-]*\b/g, // source / case / analysis ids
  /\b(?:Section|Rule|Regulation|Schedule|Clause)\s+[\w().-]+/gi,
  /\b(?:IN|US|EP|WO)\s?\d{4,}[\w/]*\b/g, // patent numbers
  /\b[A-Z][a-z]+\s[a-z]{3,}(?:\s(?:var\.|subsp\.)\s[a-z]+)?\b(?=\s*\)|\s*,|\s|$)/g, // binomials (loose)
];

const GLOSSARY = [
  "Ayurveda Aahara",
  "Ayurvedic",
  "prior art",
  "traditional knowledge",
  "access and benefit sharing",
  "Withania somnifera",
  "FSSAI",
  "AYUSH",
  "TKDL",
  "GI",
  "trademark",
  "patent",
];

export function collectProtectedTerms(text: string): string[] {
  const terms = new Set<string>();
  for (const pattern of PROTECTED_PATTERNS) {
    for (const match of text.matchAll(pattern)) terms.add(match[0]);
  }
  for (const term of GLOSSARY) if (new RegExp(term, "i").test(text)) terms.add(term);
  return [...terms];
}

const DEVANAGARI = /[\u0900-\u097F]/;
/** Words that appear in Marathi but not standard Hindi. */
const MARATHI_MARKERS = /(आहे|आणि|करण्यात|साठी|नाही|यांनी|मध्ये\s|व\s)/;

/** Deterministic, offline language detection for the three supported languages. */
export function detectLanguage(text: string): LanguageCode {
  if (!DEVANAGARI.test(text)) return "en";
  return MARATHI_MARKERS.test(text) ? "mr" : "hi";
}

const LABEL: Record<LanguageCode, string> = { en: "English", hi: "Hindi", mr: "Marathi" };

async function translate(text: string, from: LanguageCode, to: LanguageCode): Promise<{ text: string; translated: boolean }> {
  const trimmed = text?.trim();
  if (!trimmed || from === to) return { text, translated: false };
  const protectedTerms = collectProtectedTerms(trimmed);
  const instructions = `You are a terminology-preserving translator for a regulatory and intellectual-property screening system.
Translate from ${LABEL[from]} into ${LABEL[to]}.
Rules:
- Preserve meaning and intent exactly. Do not add, remove, explain or soften anything.
- Keep these strings byte-identical in the output: ${protectedTerms.length ? protectedTerms.join(" | ") : "(none)"}.
- Never translate scientific names, patent numbers, section numbers, source identifiers, case identifiers, versions, dates or URLs.
- Keep domain terminology consistent (Ayurveda, regulatory, IP and ingredient terms).
- Return only the translated text, with no commentary.`;

  try {
    const out = await generateText({ system: instructions, user: trimmed });
    const result = out.trim();
    return result ? { text: result, translated: true } : { text, translated: false };
  } catch (error) {
    console.error("TRANSLATION_FAILED", error);
    return { text, translated: false };
  }
}

export const translationService = {
  detectLanguage,
  translateToEnglish: (text: string, from: LanguageCode) => translate(text, from, "en"),
  translateFromEnglish: (text: string, to: LanguageCode) => translate(text, "en", to),
  preserveTerminology: collectProtectedTerms,
};

/** Fields that carry free text and are safe to normalise into canonical English. */
const TEXT_FIELDS: (keyof Product)[] = ["name", "type", "description", "intendedUse", "targetMarket", "preparation", "innovation", "traditionalReference", "dosageForm"];

export interface CanonicalProduct {
  product: Product;
  detected: LanguageCode;
  normalised: boolean;
  notes: string[];
}

/**
 * Produce the canonical English representation of a product submission.
 * Ingredient scientific names, quantities and identifiers are left untouched.
 */
export async function canonicaliseProduct(product: Product, declared: LanguageCode = "en"): Promise<CanonicalProduct> {
  const sample = [product.name, product.description, product.intendedUse, ...product.claims.map((c) => c.text)].join(" ");
  const detected = declared !== "en" ? declared : detectLanguage(sample);
  if (detected === "en") return { product, detected, normalised: false, notes: [] };

  const notes: string[] = [];
  const next: Product = { ...product };
  let anyTranslated = false;

  for (const field of TEXT_FIELDS) {
    const value = next[field];
    if (typeof value !== "string" || !value.trim()) continue;
    const result = await translationService.translateToEnglish(value, detected);
    if (result.translated) anyTranslated = true;
    (next as unknown as Record<string, unknown>)[field] = result.text;
  }

  next.claims = await Promise.all(
    product.claims.map(async (claim) => {
      const result = await translationService.translateToEnglish(claim.text, detected);
      if (result.translated) anyTranslated = true;
      return { ...claim, text: result.text };
    }),
  );

  next.ingredients = await Promise.all(
    product.ingredients.map(async (ingredient) => {
      const result = await translationService.translateToEnglish(ingredient.commonName, detected);
      if (result.translated) anyTranslated = true;
      // scientific name, quantity and supplier identifiers are preserved as submitted
      return { ...ingredient, commonName: result.text };
    }),
  );

  if (!anyTranslated) notes.push("Input normalisation was unavailable, so the submission was assessed in its original language.");
  return { product: next, detected, normalised: anyTranslated, notes };
}

/** Translate the user-facing narrative back into the submission language. */
export async function localiseNarrative<T extends { summary: string; uncertainties: string[] }>(
  narrative: T,
  missingInformation: string[],
  to: LanguageCode,
): Promise<{ narrative: T; missingInformation: string[]; translated: boolean }> {
  if (to === "en") return { narrative, missingInformation, translated: false };
  const summary = await translationService.translateFromEnglish(narrative.summary, to);
  const uncertainties = await Promise.all(narrative.uncertainties.map((item) => translationService.translateFromEnglish(item, to)));
  const missing = await Promise.all(missingInformation.map((item) => translationService.translateFromEnglish(item, to)));
  return {
    narrative: { ...narrative, summary: summary.text, uncertainties: uncertainties.map((u) => u.text) },
    missingInformation: missing.map((m) => m.text),
    translated: summary.translated,
  };
}
