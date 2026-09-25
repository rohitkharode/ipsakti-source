import type { MarketCode } from "@/types/domain";

export const MARKET_LABELS: Record<MarketCode, string> = {
  IN: "India",
  EU: "European Union",
  US: "United States",
  ASEAN: "ASEAN",
  GLOBAL: "Global",
};

export const MARKET_CODES = Object.keys(MARKET_LABELS) as MarketCode[];

const aliases: Record<string, MarketCode> = {
  in: "IN",
  india: "IN",
  eu: "EU",
  "european union": "EU",
  us: "US",
  usa: "US",
  "united states": "US",
  asean: "ASEAN",
  global: "GLOBAL",
};

export function normalizeMarketCode(
  value: string | undefined | null,
): MarketCode {
  return (
    aliases[
      String(value ?? "")
        .trim()
        .toLowerCase()
    ] ?? "GLOBAL"
  );
}

/** Values used by the seeded evidence corpus. */
export function marketJurisdiction(code: MarketCode): string {
  return code === "IN" ? "India" : code === "GLOBAL" ? "Global" : code;
}
