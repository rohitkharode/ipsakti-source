import rules from "@/lib/rules/classifier_rules.json";
import type { Classification, Product } from "@/types/domain";

type BoostRule = { terms: string[]; weight: number };
type Rule = {
  value: string;
  base: number;
  any?: string[];
  boost?: BoostRule[];
  penalty?: BoostRule[];
  topics?: string[];
  rationale: string;
  review?: boolean;
};

export interface ClassificationOutcome {
  classifications: Classification[];
  topics: string[];
  queries: string[];
  missingInformation: string[];
  signals: Record<string, string>;
}

function haystack(product: Product): string {
  return [
    product.name,
    product.type,
    product.description,
    product.intendedUse,
    product.dosageForm,
    product.preparation,
    product.innovation,
    product.traditionalReference,
    ...product.ingredients.flatMap((i) => [
      i.commonName,
      i.scientificName,
      i.plantPart,
    ]),
    ...product.claims.map((c) => `${c.type} ${c.text}`),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function scoreRule(
  rule: Rule,
  text: string,
): { score: number; hits: string[] } {
  const hits = (rule.any ?? []).filter((term) => text.includes(term));
  if (hits.length === 0) return { score: 0, hits };
  let score = rule.base + Math.min(0.2, (hits.length - 1) * 0.05);
  for (const boost of rule.boost ?? []) {
    if (boost.terms.some((term) => text.includes(term))) score += boost.weight;
  }
  for (const penalty of rule.penalty ?? []) {
    if (penalty.terms.some((term) => text.includes(term)))
      score -= penalty.weight;
  }
  return { score: Math.max(0, Math.min(0.95, score)), hits };
}

export function classifyProduct(product: Product): ClassificationOutcome {
  const text = haystack(product);
  const classifications: Classification[] = [];
  const topics = new Set<string>();
  const signals: Record<string, string> = {};
  const missing = (key: string, value: string | undefined) => {
    const status = product.intakeStatus?.[key];
    return (
      status !== "not_applicable" &&
      (status === "not_provided" || status === "unknown" || !value?.trim())
    );
  };

  for (const dimension of rules.dimensions as unknown as {
    id: string;
    label: string;
    default: string;
    rules: Rule[];
  }[]) {
    const scored = dimension.rules
      .map((rule) => ({ rule, ...scoreRule(rule, text) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);

    const winner = scored[0];
    if (!winner) {
      classifications.push({
        dimension: dimension.label,
        value: dimension.default,
        confidence: 30,
        rationale:
          "The submitted information does not contain enough signals to determine this dimension. Additional product detail is required.",
        evidenceIds: [],
        review: true,
      });
      signals[dimension.id] = dimension.default;
      continue;
    }

    const runnerUp = scored[1];
    const ambiguous = Boolean(runnerUp && winner.score - runnerUp.score < 0.08);
    const confidence = Math.round(
      (ambiguous ? winner.score * 0.85 : winner.score) * 100,
    );
    (winner.rule.topics ?? []).forEach((topic) => topics.add(topic));
    signals[dimension.id] = winner.rule.value;

    classifications.push({
      dimension: dimension.label,
      value: winner.rule.value,
      confidence,
      rationale: ambiguous
        ? `${winner.rule.rationale} The submitted wording also matches "${runnerUp?.rule.value}", so this dimension is ambiguous and needs confirmation.`
        : winner.rule.rationale,
      evidenceIds: [],
      review: Boolean(winner.rule.review) || ambiguous || confidence < 55,
    });
  }

  // IP relevance is derived from the other dimensions rather than matched directly.
  const innovation = signals["innovation_profile"] ?? "Unknown";
  const ipRoutes: string[] = [];
  if (innovation.startsWith("Novel"))
    ipRoutes.push("process or composition patent review");
  ipRoutes.push("trademark screening for the product name");
  if (
    text.includes("region") ||
    text.includes("origin") ||
    text.includes("geograph")
  )
    ipRoutes.push("geographical indication review");
  if (product.innovation && !innovation.startsWith("Novel"))
    ipRoutes.push("trade secret / confidentiality review");
  ipRoutes.push("prior-art and traditional-knowledge screening");

  const ipValue = innovation.startsWith("Novel")
    ? "Prior-art review recommended before patent assessment"
    : "Trademark and prior-art screening potentially relevant";

  classifications.push({
    dimension: "IP relevance",
    value: ipValue,
    confidence: innovation.startsWith("Novel") ? 68 : 60,
    rationale: `Potentially relevant routes based on the submitted information: ${ipRoutes.join(", ")}. These are screening indications, not a determination of protectability.`,
    evidenceIds: [],
    review: true,
  });
  topics.add("IP pathway");
  topics.add("Traditional knowledge");
  topics.add("Regulatory route");

  const missingInformation: string[] = [];
  if (!product.ingredients.some((i) => i.scientificName))
    missingInformation.push("Scientific (botanical) names for each ingredient");
  if (!product.ingredients.some((i) => i.plantPart))
    missingInformation.push("Plant part used for each botanical ingredient");
  if (
    !product.ingredients.some(
      (i) => i.sourceStatus && i.sourceStatus !== "unknown",
    )
  )
    missingInformation.push(
      "Whether each biological resource is cultivated or wild-collected",
    );
  if (!product.ingredients.some((i) => i.geographicSource))
    missingInformation.push(
      "Geographic source and supplier record for the biological resource",
    );
  if (missing("traditionalReference", product.traditionalReference))
    missingInformation.push(
      "Traditional text reference, where the preparation relies on one",
    );
  if (missing("dosageForm", product.dosageForm))
    missingInformation.push("Dosage form and serving size");
  if (!product.markets || product.markets.length === 0)
    missingInformation.push("Confirmed list of target markets");
  if (missing("existingRegistration", product.existingRegistration))
    missingInformation.push("Existing licence or registration status");

  const queries = [
    `${signals["product_pathway"] ?? ""} product category conditions ${product.type}`,
    `claims requirements ${product.claims.map((c) => c.text).join(" ")}`,
    `${innovation} ${product.preparation} ${product.innovation}`,
    `patent novelty prior art traditional knowledge ${product.ingredients.map((i) => i.commonName).join(" ")}`,
    `access benefit sharing biological resource ${product.ingredients
      .map((i) => i.scientificName)
      .filter(Boolean)
      .join(" ")}`,
    `trademark registration classes brand name`,
    ...(product.markets ?? [product.country]).map(
      (market) => `${market} market category requirements for ${product.type}`,
    ),
  ].filter((q) => q.trim().length > 8);

  return {
    classifications,
    topics: [...topics],
    queries,
    missingInformation,
    signals,
  };
}
