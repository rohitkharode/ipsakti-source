import { describe, expect, it } from "vitest";
import { citationHasSupport } from "@/lib/engine/llm.server";
import { detectPotentialConflicts, validateEvidence } from "@/lib/engine/validate.server";
import type { Evidence } from "@/types/domain";

function evidence(overrides: Partial<Evidence> = {}): Evidence {
  return {
    id: "EVD-TEST-1",
    sourceId: "SRC-TEST-1",
    documentId: "DOC-TEST-1",
    sourceType: "official_government_regulatory",
    topic: "Claims",
    authority: "Test authority",
    title: "Test source",
    section: "Claims",
    jurisdiction: "India",
    effectiveDate: "2025-01-01",
    version: "1",
    level: "Primary",
    provision: "The claim is permitted when substantiated.",
    relevance: "test",
    url: "https://example.test/source",
    verified: false,
    evidenceQuality: "CURATED",
    verificationStatus: "curated_summary",
    provenance: { sourceId: "SRC-TEST-1", documentId: "DOC-TEST-1", chunkId: "EVD-TEST-1", sourceName: "Test source", section: "Claims" },
    retrieval: { lexicalScore: 0.9, semanticScore: 0, authorityScore: 1, jurisdictionMatch: true, fusedScore: 0.8, rerankScore: 0.8, why: "test" },
    ...overrides,
  };
}

describe("Session 2 evidence validation", () => {
  it("accepts traceable curated evidence but marks it UNVERIFIED", () => {
    const result = validateEvidence([evidence()], ["IN"]);
    expect(result.accepted[0]?.validationStatus).toBe("UNVERIFIED");
    expect(result.rejected).toHaveLength(0);
  });

  it("rejects evidence without complete provenance", () => {
    const result = validateEvidence([evidence({ documentId: undefined, provenance: undefined })], ["IN"]);
    expect(result.rejected[0]?.evidence.validationStatus).toBe("INSUFFICIENT");
  });

  it("rejects evidence outside the selected market", () => {
    const result = validateEvidence([evidence({ jurisdiction: "EU" })], ["IN"]);
    expect(result.rejected[0]?.reason).toContain("outside the selected market");
  });

  it("does not flag compatible sources", () => {
    expect(detectPotentialConflicts([evidence(), evidence({ id: "EVD-TEST-2", sourceId: "SRC-TEST-2", provision: "The claim is allowed when substantiated." })])).toHaveLength(0);
  });

  it("flags explicit incompatible requirement language", () => {
    const result = detectPotentialConflicts([evidence(), evidence({ id: "EVD-TEST-2", sourceId: "SRC-TEST-2", provision: "The claim is not permitted under this pathway." })]);
    expect(result[0]).toContain("Potential conflict");
  });
});

describe("Session 2 citation guard", () => {
  it("accepts a citation with lexical claim/evidence alignment", () => {
    expect(citationHasSupport("The claim is permitted when substantiated", [evidence()])).toBe(true);
  });

  it("rejects a citation with no meaningful alignment", () => {
    expect(citationHasSupport("Quantum cryptography requires a satellite", [evidence()])).toBe(false);
  });
});
