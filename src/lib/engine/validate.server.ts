import { marketJurisdiction, normalizeMarketCode } from "@/lib/markets";
import type { Evidence, EvidenceValidationStatus } from "@/types/domain";

export interface ValidationOutcome {
  accepted: Evidence[];
  rejected: { evidence: Evidence; reason: string }[];
  conflicts: string[];
  coverage: number;
}

function hasPositiveRequirement(text: string): boolean {
  return /\b(permitted|allowed|may be used|can be used|eligible|authori[sz]ed)\b/i.test(
    text,
  );
}

function hasNegativeRequirement(text: string): boolean {
  return /\b(prohibited|not permitted|must not|cannot|not allowed|ineligible|restricted)\b/i.test(
    text,
  );
}

/** Conservative first-pass contradiction detection. */
export function detectPotentialConflicts(items: Evidence[]): string[] {
  const conflicts: string[] = [];
  const groups = new Map<string, Evidence[]>();
  for (const item of items) {
    const key = `${item.jurisdiction}:${item.topic ?? item.section}`;
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }

  for (const [key, group] of groups) {
    for (let left = 0; left < group.length; left += 1) {
      for (let right = left + 1; right < group.length; right += 1) {
        const a = group[left]!;
        const b = group[right]!;
        if (a.sourceId === b.sourceId) continue;
        const aPositive = hasPositiveRequirement(a.provision);
        const aNegative = hasNegativeRequirement(a.provision);
        const bPositive = hasPositiveRequirement(b.provision);
        const bNegative = hasNegativeRequirement(b.provision);
        if ((aPositive && bNegative) || (aNegative && bPositive)) {
          conflicts.push(
            `Potential conflict in ${key}: ${a.id} and ${b.id} use incompatible requirement language.`,
          );
        }
      }
    }
  }
  return conflicts;
}

function validationStatus(input: {
  authorityOk: boolean;
  jurisdictionOk: boolean;
  currentnessOk: boolean;
  relevanceOk: boolean;
  citationOk: boolean;
  verificationOk: boolean;
}): EvidenceValidationStatus {
  if (!input.relevanceOk || !input.citationOk || !input.jurisdictionOk)
    return "INSUFFICIENT";
  if (!input.verificationOk) return "UNVERIFIED";
  if (!input.authorityOk || !input.currentnessOk) return "PARTIAL";
  return "VALID";
}

/** Validate evidence without treating curated prototype summaries as verified passages. */
export function validateEvidence(
  items: Evidence[],
  markets: string[],
): ValidationOutcome {
  const targetJurisdictions = new Set(
    markets.map((market) => marketJurisdiction(normalizeMarketCode(market))),
  );
  const accepted: Evidence[] = [];
  const rejected: { evidence: Evidence; reason: string }[] = [];

  for (const item of items) {
    const notes: string[] = [];
    const authorityOk =
      Boolean(item.sourceType?.startsWith("official")) ||
      item.level === "Primary";
    const jurisdictionOk =
      targetJurisdictions.has(item.jurisdiction) ||
      item.jurisdiction === "Global";
    const currentnessOk = item.effectiveDate !== "Not stated";
    const relevanceOk =
      (item.retrieval?.rerankScore ?? item.retrieval?.fusedScore ?? 0) >= 0.25;
    const citationOk = Boolean(
      item.id &&
      item.sourceId &&
      item.documentId &&
      item.section &&
      item.provision.trim() &&
      item.provenance?.chunkId === item.id,
    );
    const verificationOk = item.evidenceQuality === "VERIFIED" && item.verified;

    if (!authorityOk)
      notes.push("Source authority class is unknown or non-official.");
    if (!jurisdictionOk)
      notes.push(
        `Applies to ${item.jurisdiction}, outside the selected market scope.`,
      );
    if (!currentnessOk)
      notes.push("No effective date recorded; currentness is unknown.");
    if (!relevanceOk)
      notes.push("Reranked relevance is below the evidence threshold.");
    if (!citationOk)
      notes.push(
        "Evidence cannot be traced to a complete source/document/chunk location.",
      );
    if (!verificationOk)
      notes.push(
        `Evidence quality is ${item.evidenceQuality ?? "UNKNOWN"}; source passage verification is unavailable.`,
      );

    const status = validationStatus({
      authorityOk,
      jurisdictionOk,
      currentnessOk,
      relevanceOk,
      citationOk,
      verificationOk,
    });
    const validated: Evidence = {
      ...item,
      validationStatus: status,
      validation: {
        authorityOk,
        jurisdictionOk,
        currentnessOk,
        relevanceOk,
        citationOk,
        notes,
        status,
      },
    };
    if (status === "INSUFFICIENT")
      rejected.push({
        evidence: validated,
        reason:
          notes[0] ?? "Evidence did not meet minimum validation requirements.",
      });
    else accepted.push(validated);
  }

  const conflicts = detectPotentialConflicts(accepted);
  const conflictIds = new Set<string>();
  conflicts.forEach((message) =>
    (message.match(/EVD-[A-Z0-9-]+/g) ?? []).forEach((id) =>
      conflictIds.add(id),
    ),
  );
  const finalAccepted = accepted.map((item) => {
    if (!conflictIds.has(item.id)) return item;
    const notes = [
      ...(item.validation?.notes ?? []),
      "Potential conflict detected with another accepted source.",
    ];
    return {
      ...item,
      validationStatus: "CONFLICTING" as const,
      validation: {
        ...item.validation!,
        status: "CONFLICTING" as const,
        notes,
      },
    };
  });

  return {
    accepted: finalAccepted,
    rejected,
    conflicts,
    coverage: items.length === 0 ? 0 : finalAccepted.length / items.length,
  };
}
