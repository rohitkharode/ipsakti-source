import type { Classification, Evidence, Explanation, GroundedClaim, SupportLevel } from "@/types/domain";
import { generateText } from "@/lib/llm/provider.server";

const SUPPORT_LEVELS: SupportLevel[] = ["supported", "partially_supported", "unsupported", "conflicting", "insufficient_evidence"];
const CITATION_STOP_WORDS = new Set(["the", "and", "for", "with", "this", "that", "from", "into", "based", "product", "system", "may", "must", "where", "which", "under"]);

export function citationHasSupport(claimText: string, citedEvidence: Evidence[]): boolean {
  const tokens = (text: string) => new Set(text.toLowerCase().match(/[a-z][a-z0-9-]{3,}/g)?.filter((token) => !CITATION_STOP_WORDS.has(token)) ?? []);
  const claimTokens = tokens(claimText);
  const evidenceTokens = new Set(citedEvidence.flatMap((evidence) => [...tokens(evidence.provision)]));
  return claimTokens.size === 0 || [...claimTokens].some((token) => evidenceTokens.has(token));
}

interface RawResponse {
  summary: string;
  summary_evidence?: string[];
  claims: { claim: string; supporting_evidence: string[]; support_level: string }[];
  uncertainties: string[];
}

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: { type: "string" },
    summary_evidence: { type: "array", items: { type: "string" } },
    claims: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          claim: { type: "string" },
          supporting_evidence: { type: "array", items: { type: "string" } },
          support_level: { type: "string", enum: SUPPORT_LEVELS },
        },
        required: ["claim", "supporting_evidence", "support_level"],
      },
    },
    uncertainties: { type: "array", items: { type: "string" } },
  },
  required: ["summary", "summary_evidence", "claims", "uncertainties"],
};

const SYSTEM = `You are the explanation layer of a preliminary Ayurveda product-to-compliance screening system.
Rules you must follow exactly:
- Use ONLY the supplied evidence for any factual regulatory, legal or scientific statement.
- Every factual claim must cite one or more supplied evidence ids in supporting_evidence.
- The summary must cite one or more supplied evidence ids in summary_evidence when it contains factual content.
- Never invent regulations, sections, source names, urls or evidence ids.
- Never state a legal conclusion, guarantee, approval, or that something is patentable, novel, compliant or approved.
- Use wording such as "preliminary assessment", "potentially applicable", "evidence found", "further verification required".
- Where the evidence does not support a point, say so and use support_level "insufficient_evidence".
- Distinguish what the source states from what the system infers; an inference is a claim with support_level "partially_supported" at best.
- Keep the summary under 140 words, plain and professional.`;

/** Grounded generation followed by the citation guard. */
export async function generateGroundedExplanation(input: {
  productSummary: string;
  classifications: Classification[];
  evidence: Evidence[];
  routingContext: string;
}): Promise<Explanation> {
  const validIds = new Set(input.evidence.map((e) => e.id));
  const guardNotes: string[] = [];

  if (input.evidence.length === 0) {
    return {
      summary: "No authoritative evidence passed validation for this submission, so no grounded explanation was produced.",
      claims: [],
      uncertainties: ["Insufficient authoritative evidence."],
      generated: false,
      guardNotes: ["Generation skipped: safe abstention on empty evidence set."],
    };
  }

  const evidenceBlock = input.evidence
    .map((e) => `[${e.id}] ${e.title} — ${e.section} (${e.jurisdiction}, ${e.version}, effective ${e.effectiveDate})\n${e.provision}`)
    .join("\n\n");
  const provenanceBlock = input.evidence
    .map((e) => `[${e.id}] quality=${e.evidenceQuality ?? "UNKNOWN"}; verification=${e.verificationStatus ?? "unknown"}; sourceType=${e.sourceType ?? "unknown"}; document=${e.documentId ?? "unknown"}; chunk=${e.provenance?.chunkId ?? "unknown"}; url=${e.url ?? "unavailable"}`)
    .join("\n");

  let raw: RawResponse;
  try {
    const generationRequest = {
      system: SYSTEM,
      user: `PRODUCT\n${input.productSummary}\n\nPRELIMINARY CLASSIFICATION\n${input.classifications
        .map((c) => `${c.dimension}: ${c.value} (confidence ${c.confidence}%) — ${c.rationale}`)
        .join("\n")}\n\nROUTING CONTEXT\n${input.routingContext}\n\nEVIDENCE PROVENANCE\n${provenanceBlock}\n\nEVIDENCE\n${evidenceBlock}`,
    };
    let text: string;
    try {
      text = await generateText({ ...generationRequest, responseSchema: SCHEMA });
    } catch (structuredError) {
      // Some free OpenRouter models do not support provider-enforced JSON
      // schema even though they can return valid JSON when prompted.
      console.warn("structured grounded generation failed; retrying without response schema", structuredError);
      text = await generateText(generationRequest);
    }
    const jsonText = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    raw = JSON.parse(jsonText) as RawResponse;
  } catch (error) {
    console.error("grounded generation failed", error);
    return {
      summary: "The grounded explanation could not be generated for this analysis. The classification, evidence and routing results below were produced by the deterministic engine and are unaffected.",
      claims: [],
      uncertainties: ["Explanation generation failed."],
      generated: false,
      guardNotes: ["Generation error; no unverified text was shown."],
    };
  }

  // ---- Citation guard -------------------------------------------------
  const claims: GroundedClaim[] = [];
  const hasSemanticSupport = (claimText: string, evidenceIds: string[]) => {
    return citationHasSupport(claimText, input.evidence.filter((e) => evidenceIds.includes(e.id)));
  };
  for (const claim of raw.claims ?? []) {
    const cited = (claim.supporting_evidence ?? []).filter((id) => validIds.has(id));
    const dropped = (claim.supporting_evidence ?? []).filter((id) => !validIds.has(id));
    if (dropped.length) guardNotes.push(`Removed ${dropped.length} citation(s) that do not exist in the retrieved evidence set.`);
    let level = (SUPPORT_LEVELS as string[]).includes(claim.support_level) ? (claim.support_level as SupportLevel) : "insufficient_evidence";
    if (cited.length === 0) {
      level = "unsupported";
      guardNotes.push("A statement without traceable evidence was downgraded to unsupported and is not presented as a finding.");
      continue;
    }
    if (!hasSemanticSupport(claim.claim, cited)) {
      guardNotes.push(`Flagged claim without meaningful lexical alignment to its cited evidence: ${claim.claim.slice(0, 80)}.`);
      continue;
    }
    if (/guarantee|approved|fully compliant|is patentable|definitely|no permission/i.test(claim.claim)) {
      guardNotes.push("A statement using definitive legal wording was removed.");
      continue;
    }
    claims.push({ claim: claim.claim, supportingEvidence: cited, supportLevel: level });
  }

  const supported = claims.filter((c) => c.supportLevel === "supported" || c.supportLevel === "partially_supported");
  if (supported.length === 0) guardNotes.push("No claim passed the citation guard; confidence was downgraded.");

  const summaryIds = (raw.summary_evidence ?? []).filter((id) => validIds.has(id));
  const safeSummary = summaryIds.length && hasSemanticSupport(raw.summary ?? "", summaryIds)
    ? raw.summary?.slice(0, 1200) ?? ""
    : "No grounded summary was produced from the accepted evidence. Further expert verification is required.";
  if (summaryIds.length === 0 && raw.summary?.trim()) guardNotes.push("Replaced a summary without traceable evidence with a safe limitation.");

  return {
    summary: safeSummary,
    claims,
    uncertainties: raw.uncertainties ?? [],
    generated: true,
    guardNotes,
  };
}
