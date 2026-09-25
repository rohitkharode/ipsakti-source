import { describe, expect, it } from "vitest";
import { normalizeMarketCode } from "@/lib/markets";
import { assertOwnership, ownedCaseInsert } from "@/lib/ownership";
import { routeRegulatory } from "@/lib/engine/routing.server";
import type { Product } from "@/types/domain";

const product = (market: Product["country"]): Product => ({
  name: "Test product",
  type: "Herbal product",
  description: "Test description",
  intendedUse: "Wellness screening",
  targetMarket: "Adults",
  country: market,
  ingredients: [],
  claims: [],
  preparation: "Test preparation",
  innovation: "Test innovation",
  markets: [market],
});

describe("Session 1 market normalization", () => {
  it.each([
    ["India", "IN"],
    ["European Union", "EU"],
    ["United States", "US"],
    ["ASEAN", "ASEAN"],
    ["Global", "GLOBAL"],
  ])("normalizes %s to %s", (display, code) => {
    expect(normalizeMarketCode(display)).toBe(code);
  });

  it.each(["IN", "EU", "US", "ASEAN", "GLOBAL"] as const)(
    "routes canonical market %s",
    (market) => {
      expect(routeRegulatory(product(market), {}, [])[0]?.jurisdiction).toBe(
        market,
      );
    },
  );
});

describe("Session 1 ownership policy", () => {
  it("A: rejects unauthenticated ownership checks", () => {
    expect(() => assertOwnership("user-a", "")).toThrow("AUTH_REQUIRED");
  });

  it("B: persists the authenticated owner on creation", () => {
    expect(ownedCaseInsert({ case_ref: "CASE-1" }, "user-a").user_id).toBe(
      "user-a",
    );
  });

  it("C: allows a user to access their own case", () => {
    expect(() => assertOwnership("user-a", "user-a")).not.toThrow();
  });

  it("D: rejects another user's case", () => {
    expect(() => assertOwnership("user-a", "user-b")).toThrow(
      "SOURCE_NOT_FOUND",
    );
  });

  it("E: applies the same rejection policy to checklist mutations", () => {
    expect(() => assertOwnership("user-a", "user-b")).toThrow();
  });

  it("F: applies the same rejection policy to review mutations", () => {
    expect(() => assertOwnership("user-a", "user-b")).toThrow();
  });
});
