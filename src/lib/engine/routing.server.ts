import rules from "@/lib/rules/classifier_rules.json";
import { marketJurisdiction } from "@/lib/markets";
import type { ABSAssessment, ComplianceRoute, Evidence, IPPathway, MarketScreening, Product, TKScreening } from "@/types/domain";

const marketRules = rules.markets as Record<string, { authority: string; category: string }>;

function pick(evidence: Evidence[], tags: string[], limit = 2) {
  return evidence
    .filter((item) => tags.some((tag) => `${item.section} ${item.provision} ${item.title}`.toLowerCase().includes(tag)))
    .slice(0, limit)
    .map((item) => item.id);
}

export function routeIP(product: Product, signals: Record<string, string>, evidence: Evidence[]): IPPathway[] {
  const innovation = signals["innovation_profile"] ?? "Unknown";
  const novel = innovation.startsWith("Novel");
  const pathways: IPPathway[] = [];

  pathways.push({
    name: "Patent",
    relevance: novel ? "Potentially relevant" : "Further evidence required",
    reason: novel
      ? "The submitted preparation describes a process that differs from a classically described preparation, so technical features may be assessable for novelty and inventive step."
      : "No clearly novel technical feature was identified in the submitted description; a patent route cannot be assessed on the current information.",
    nextStep: "Commission a process-focused prior-art search covering patent and non-patent literature, including documented traditional knowledge, before any novelty opinion.",
    confidence: novel ? "Needs review" : "Moderate",
    evidenceIds: pick(evidence, ["patent", "novelty", "prior art"]),
  });

  pathways.push({
    name: "Trademark",
    relevance: "Potentially relevant",
    reason: "The product name and range name may function as commercial source identifiers for the goods being sold.",
    nextStep: "Screen the proposed mark on the register for the relevant classes of goods in each target market.",
    confidence: "Moderate",
    evidenceIds: pick(evidence, ["trade mark", "trademark", "classes of goods"]),
  });

  const originSignal = `${product.description} ${product.ingredients.map((i) => i.geographicSource ?? "").join(" ")}`.toLowerCase();
  pathways.push({
    name: "Geographical Indication",
    relevance: originSignal.includes("region") || originSignal.match(/[a-z]{3,}/) && product.ingredients.some((i) => i.geographicSource) ? "Review recommended" : "Further evidence required",
    reason: "A geographical indication is sought by a producer association for goods whose quality or reputation is attributable to a defined origin, rather than by a single manufacturer.",
    nextStep: "Confirm whether the sourcing region already holds a registered indication, and whether the product may use it as an authorised user.",
    confidence: "Needs review",
    evidenceIds: pick(evidence, ["geographical indication"]),
  });

  pathways.push({
    name: "Trade Secret",
    relevance: product.innovation ? "Potentially relevant" : "Further evidence required",
    reason: "Process parameters that are not disclosed publicly may be maintained through confidentiality measures instead of, or alongside, a patent filing.",
    nextStep: "Document the confidentiality measures applied to the process and supplier agreements before any public disclosure.",
    confidence: "Moderate",
    evidenceIds: [],
  });

  pathways.push({
    name: "Prior Art",
    relevance: "Review recommended",
    reason: "Documented traditional knowledge and existing literature affect the assessment of novelty for botanical preparations.",
    nextStep: "Run a structured prior-art screen before filing decisions; record the databases searched and the date of search.",
    confidence: "Needs review",
    evidenceIds: pick(evidence, ["prior art", "traditional knowledge"]),
  });

  pathways.push({
    name: "Traditional Knowledge",
    relevance: "Review recommended",
    reason: "The ingredients and preparation draw on traditional medicine systems whose documented use may be cited against an application.",
    nextStep: "Map submitted claims and preparation changes against documented traditional use through the authorised verification route.",
    confidence: "Needs review",
    evidenceIds: pick(evidence, ["traditional knowledge", "tkdl"]),
  });

  return pathways;
}

export function routeRegulatory(product: Product, signals: Record<string, string>, evidence: Evidence[]): ComplianceRoute[] {
  const markets = product.markets?.length ? product.markets : [product.country || "IN"];
  const pathway = signals["product_pathway"] ?? "Needs review";
  const claim = signals["claim_profile"] ?? "Unclear";

  return markets.map((market) => {
    const rule = marketRules[market] ?? marketRules["GLOBAL"]!;
    const checks: string[] = [];

    if (market === "IN") {
      checks.push("Confirm whether the product is presented as food or as an Ayurvedic medicine, since the licensing route differs.");
      checks.push("Check the composition against the applicable ingredient schedules for the category.");
      checks.push("Review each claim against the conditions for claims, including restrictions on disease-related wording.");
      checks.push("Confirm the manufacturing licence and category-specific labelling obligations.");
      if (claim.startsWith("Therapeutic")) checks.push("Therapeutic wording was detected: confirm whether a medicine licensing route applies before marketing as food.");
    } else if (market === "EU") {
      checks.push("Screen the ingredient and its production process against the novel-food definition, including significant compositional change.");
      checks.push("Confirm the history of consumption in the Union before 15 May 1997 for the specific preparation.");
      checks.push("Check permitted claim wording in the destination member state.");
    } else if (market === "US") {
      checks.push("Determine whether the ingredient is a new dietary ingredient requiring premarket notification.");
      checks.push("Confirm the claim type and the required disclaimer for structure/function wording.");
    } else if (market === "ASEAN") {
      checks.push("Confirm the destination member state's category for traditional medicines or health supplements.");
      checks.push("Confirm ingredient acceptability and permitted claim wording per destination market.");
    } else {
      checks.push("Confirm the destination-market category and the responsible regulator before export planning.");
    }

    return {
      jurisdiction: market,
      pathway: `${rule.category} — preliminary assessment based on: ${pathway}`,
      authority: rule.authority,
      checks,
      evidenceIds: evidence.filter((e) => e.jurisdiction === marketJurisdiction(market)).slice(0, 3).map((e) => e.id),
      uncertainty:
        market === "IN"
          ? undefined
          : "Prototype coverage for this market is limited to screening-level references; confirm the current national requirements before relying on this route.",
    };
  });
}

export function screenTK(product: Product, evidence: Evidence[]): TKScreening {
  const triggers = (rules.tk.triggerTerms as string[]).filter((term) =>
    `${product.name} ${product.description} ${product.ingredients.map((i) => i.commonName).join(" ")}`.toLowerCase().includes(term),
  );
  return {
    relevance: triggers.length ? "Traditional-knowledge screening recommended" : "Further evidence required",
    reason: triggers.length
      ? `The submission references traditional material (${triggers.join(", ")}). Documented traditional knowledge may be cited as prior art and affects claim wording.`
      : "No explicit traditional-knowledge signal was found in the submitted text, so the screening result is inconclusive.",
    knownEvidence: pick(evidence, ["traditional knowledge", "prior art", "tkdl"], 3),
    missingVerification: [
      "Search result from the authorised prior-art verification route, with search date",
      "Mapping of each claim to the documented traditional use relied upon",
    ],
    verificationRoute:
      "The Traditional Knowledge Digital Library is not an open database. Screening must be carried out through the applicable authorised access route or with a qualified prior-art searcher. This system has not searched it.",
    reviewRequired: true,
  };
}

export function screenABS(product: Product, evidence: Evidence[]): ABSAssessment {
  const biological = product.ingredients.filter((i) =>
    (rules.abs.triggerTerms as string[]).some((term) => `${i.commonName} ${i.scientificName} ${i.plantPart ?? ""}`.toLowerCase().includes(term)) || Boolean(i.scientificName),
  );
  const missing: string[] = [];
  biological.forEach((i) => {
    if (!i.sourceStatus || i.sourceStatus === "unknown") missing.push(`Cultivated or wild-collected status for ${i.commonName}`);
    if (!i.geographicSource) missing.push(`Geographic source for ${i.commonName}`);
    if (!i.supplier) missing.push(`Supplier and sourcing documentation for ${i.commonName}`);
  });

  return {
    relevance: biological.length
      ? missing.length
        ? "Potentially relevant — information incomplete"
        : "Potentially relevant"
      : "Further evidence required",
    reason: biological.length
      ? "The product uses biological resources, so access and benefit-sharing obligations may apply depending on the documented source, the cultivation status and the intended commercial use, including any intellectual property application based on the resource."
      : "No biological resource was identified in the submitted information.",
    missingInformation: [...new Set(missing)],
    verificationRequired:
      "Confirm the applicable approval or intimation route with the competent authority before commercial utilisation or an IP filing based on the resource. This is a screening indication, not a determination.",
    authority: rules.abs.authority,
    evidenceIds: pick(evidence, ["biological", "benefit", "abs"], 2),
  };
}

export function screenMarkets(product: Product, evidence: Evidence[]): MarketScreening[] {
  const markets = product.markets?.length ? product.markets : [product.country || "IN"];
  return markets.map((market) => {
    const rule = marketRules[market] ?? marketRules["GLOBAL"]!;
    const marketEvidence = evidence.filter((e) => e.jurisdiction === marketJurisdiction(market));
    return {
      market,
      potentialCategory: rule.category,
      authority: rule.authority,
      missingInformation: marketEvidence.length
        ? ["Destination-market label copy and claim wording for review"]
        : ["No market-specific evidence is indexed for this market in the prototype corpus"],
      reviewStatus: marketEvidence.length ? "Screening-level assessment available" : "Evidence incomplete — expert review required",
      evidenceIds: marketEvidence.map((e) => e.id).slice(0, 3),
    };
  });
}
