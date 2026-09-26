import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { buildChecklist } from "./checklist.server";
import { classifyProduct } from "./classify.server";
import { generateGroundedExplanation } from "./llm.server";
import { hybridRetrieve, toEvidence } from "./retrieval.server";
import {
  routeIP,
  routeRegulatory,
  screenABS,
  screenMarkets,
  screenTK,
} from "./routing.server";
import { canonicaliseProduct, localiseNarrative } from "./translate.server";
import { validateEvidence } from "./validate.server";
import { failure, AppError } from "@/lib/errors";
import { marketJurisdiction } from "@/lib/markets";
import { ownedCaseInsert } from "@/lib/ownership";
import { isLLMConfigured } from "@/lib/llm/config.server";
import type {
  Analysis,
  Evidence,
  FailureState,
  LanguageCode,
  Product,
} from "@/types/domain";

function confidenceLabel(value: number) {
  if (value >= 75) return "High confidence";
  if (value >= 55) return "Moderate confidence";
  return "Low confidence";
}

async function audit(
  caseId: string,
  analysisId: string | null,
  eventType: string,
  detail: Record<string, unknown> = {},
) {
  await supabaseAdmin
    .from("audit_events")
    .insert({
      case_id: caseId,
      analysis_id: analysisId,
      event_type: eventType,
      detail: detail as never,
    });
}

export async function runAnalysis(
  submitted: Product,
  language: LanguageCode = "en",
  userId: string,
): Promise<Analysis> {
  if (
    !submitted.name.trim() ||
    !submitted.type.trim() ||
    !submitted.description.trim() ||
    !submitted.intendedUse.trim()
  ) {
    throw new AppError(
      "INSUFFICIENT_PRODUCT_DATA",
      "Product name, type, description and intended use are required.",
    );
  }
  if (!userId)
    throw new AppError("AUTH_REQUIRED", "Authentication is required.", false);
  let product = submitted;
  const failureStates: FailureState[] = [];
  const stamp = Date.now().toString().slice(-5);
  const caseRef = `CASE-${stamp}`;
  const analysisRef = `IPS-${new Date().getFullYear()}-${stamp}`;

  const { data: caseRow, error: caseError } = await supabaseAdmin
    .from("cases")
    .insert(
      ownedCaseInsert(
        {
          case_ref: caseRef,
          product: submitted as never,
          language,
          status: "processing",
        },
        userId,
      ),
    )
    .select()
    .single();
  if (caseError || !caseRow)
    throw new AppError("DATABASE_ERROR", "The case could not be saved.");
  await audit(caseRow.id, null, "case_created", { caseRef });

  const { data: analysisRow, error: analysisError } = await supabaseAdmin
    .from("analyses")
    .insert({
      analysis_ref: analysisRef,
      case_id: caseRow.id,
      status: "processing",
      language,
    })
    .select()
    .single();
  if (analysisError || !analysisRow)
    throw new AppError(
      "DATABASE_ERROR",
      "The analysis record could not be created.",
    );
  await audit(caseRow.id, analysisRow.id, "analysis_started", { analysisRef });

  // 0. Canonical English representation (reasoning always runs in English)
  const canonical = await canonicaliseProduct(submitted, language);
  product = canonical.product;
  if (canonical.detected !== "en") {
    await audit(caseRow.id, analysisRow.id, "input_normalised", {
      detected: canonical.detected,
      normalised: canonical.normalised,
    });
  }

  // 1. Deterministic classification
  const classification = classifyProduct(product);
  await audit(caseRow.id, analysisRow.id, "classification_completed", {
    signals: classification.signals,
  });

  // 2. Hybrid retrieval
  const marketCodes = product.markets?.length
    ? product.markets
    : [product.country || "IN"];
  const jurisdictions = marketCodes.map(marketJurisdiction);
  if (!isLLMConfigured()) {
    failureStates.push(
      failure(
        "VECTOR_UNAVAILABLE",
        "Dense retrieval is unavailable; lexical retrieval was used where possible.",
      ),
    );
    failureStates.push(
      failure(
        "LLM_UNAVAILABLE",
        "Grounded explanation service is not configured; deterministic results are shown.",
      ),
    );
    if (canonical.detected !== "en")
      failureStates.push(
        failure(
          "TRANSLATION_UNAVAILABLE",
          "Translation service is unavailable; the original language was retained.",
        ),
      );
  }
  const ingredientQueries = product.ingredients
    .flatMap((ingredient) => [ingredient.commonName, ingredient.scientificName])
    .filter((value) => Boolean(value?.trim()));
  const retrievalQueries = [
    ...new Set([...classification.queries, ...ingredientQueries]),
  ];
  const retrieved = await hybridRetrieve({
    queries: retrievalQueries,
    marketCodes,
    jurisdictions,
    topics: classification.topics,
    limit: 10,
  });

  const sourceIds = [...new Set(retrieved.map((r) => r.chunk.source_id))];
  const { data: sourceRows } = await supabaseAdmin
    .from("sources")
    .select("*")
    .in("id", sourceIds.length ? sourceIds : ["none"]);
  const sourceMap = new Map((sourceRows ?? []).map((s) => [s.id, s]));

  const candidates: Evidence[] = retrieved
    .map((item) => {
      const source = sourceMap.get(item.chunk.source_id);
      if (!source) return null;
      return toEvidence(item, source as never);
    })
    .filter((e): e is Evidence => Boolean(e));

  await audit(caseRow.id, analysisRow.id, "evidence_retrieved", {
    retrieved: candidates.length,
  });

  // 3. Evidence validation
  const validation = validateEvidence(candidates, marketCodes);
  const evidence = validation.accepted;
  if (evidence.length === 0)
    failureStates.push(
      failure(
        "NO_EVIDENCE",
        "No evidence passed validation for this submission.",
      ),
    );
  if (validation.conflicts.length > 0)
    failureStates.push(
      failure(
        "CONFLICTING_EVIDENCE",
        "Evidence requires human review because sources overlap or conflict.",
      ),
    );

  // attach evidence to classification dimensions
  classification.classifications.forEach((dimension) => {
    dimension.evidenceIds = evidence
      .filter(
        (e) =>
          `${e.section} ${e.provision}`
            .toLowerCase()
            .includes(dimension.dimension.split(" ")[0]!.toLowerCase()) ||
          e.jurisdiction === jurisdictions[0],
      )
      .slice(0, 2)
      .map((e) => e.id);
  });

  // 4. Deterministic routing
  const pathways = routeIP(product, classification.signals, evidence);
  const compliance = routeRegulatory(product, classification.signals, evidence);
  const tk = screenTK(product, evidence);
  const abs = screenABS(product, evidence);
  const markets = screenMarkets(product, evidence);

  // 5. Confidence and safe abstention
  const classificationAvg =
    classification.classifications.reduce((sum, c) => sum + c.confidence, 0) /
    classification.classifications.length;
  const evidenceFactor = Math.min(1, evidence.length / 6);
  const gapPenalty = Math.min(20, classification.missingInformation.length * 3);
  const conflictPenalty = validation.conflicts.length * 4;
  const confidence = Math.max(
    10,
    Math.round(
      classificationAvg * 0.6 +
        evidenceFactor * 40 -
        gapPenalty -
        conflictPenalty,
    ),
  );
  const abstained = evidence.length === 0 || confidence < 40;
  if (abstained || confidence < 65)
    failureStates.push(
      failure(
        "HUMAN_REVIEW_REQUIRED",
        "Human review is required before relying on this screening result.",
      ),
    );

  // 6. Grounded generation + citation guard
  const explanation = await generateGroundedExplanation({
    productSummary: `${product.name} (${product.type}). ${product.description} Intended use: ${product.intendedUse}. Preparation: ${product.preparation}. Innovation: ${product.innovation}. Markets: ${jurisdictions.join(", ")}. Ingredients: ${product.ingredients
      .map(
        (i) =>
          `${i.commonName}${i.scientificName ? ` (${i.scientificName})` : ""} ${i.quantity}`,
      )
      .join(
        "; ",
      )}. Claims: ${product.claims.map((c) => `${c.type}: ${c.text}`).join("; ")}`,
    classifications: classification.classifications,
    evidence,
    routingContext: `IP routes: ${pathways.map((p) => `${p.name} — ${p.relevance}`).join("; ")}. Regulatory routes: ${compliance
      .map((c) => `${c.jurisdiction} — ${c.pathway}`)
      .join(
        "; ",
      )}. ABS: ${abs.relevance}. Traditional knowledge: ${tk.relevance}.`,
  });
  if (!explanation.generated && evidence.length > 0 && isLLMConfigured()) {
    failureStates.push(
      failure(
        "LLM_UNAVAILABLE",
        "The grounded explanation service failed; deterministic results are shown.",
      ),
    );
  }
  await audit(caseRow.id, analysisRow.id, "assessment_generated", {
    generated: explanation.generated,
    guard: explanation.guardNotes.length,
  });

  // 6b. Localise the narrative back into the submission language (evidence stays in its original language)
  const localised = await localiseNarrative(
    explanation,
    classification.missingInformation,
    canonical.detected,
  );
  const narrative = localised.narrative;
  const missingInformation = [
    ...localised.missingInformation,
    ...canonical.notes,
  ];
  if (
    canonical.detected !== "en" &&
    !localised.translated &&
    !failureStates.some((item) => item.code === "TRANSLATION_UNAVAILABLE")
  ) {
    failureStates.push(
      failure(
        "TRANSLATION_UNAVAILABLE",
        "Translation service was unavailable; the original language was retained.",
      ),
    );
  }
  if (localised.translated)
    await audit(caseRow.id, analysisRow.id, "response_translated", {
      language: canonical.detected,
    });

  // 7. Checklist
  const drafts = buildChecklist({
    classifications: classification.classifications,
    pathways,
    compliance,
    tk,
    abs,
    evidence,
    missingInformation: classification.missingInformation,
    confidence,
  });
  const { data: checklistRows } = await supabaseAdmin
    .from("checklist_items")
    .insert(
      drafts.map((item) => ({
        analysis_id: analysisRow.id,
        title: item.title,
        description: item.description,
        priority: item.priority,
        status: item.status,
        evidence_id: item.evidenceId ?? null,
        position: item.position,
      })),
    )
    .select();

  // 8. Human escalation
  const escalate =
    abstained ||
    confidence < 65 ||
    validation.conflicts.length > 0 ||
    classification.classifications.some((c) => c.review) ||
    tk.reviewRequired;
  const review = {
    level: (abstained ? "required" : escalate ? "recommended" : "none") as
      "required" | "recommended" | "none",
    reason: abstained
      ? "There is not enough authoritative evidence to produce a screening assessment with sufficient confidence."
      : escalate
        ? "The assessment relies on ambiguous classification signals, incomplete information or prior-art screening that this system cannot complete."
        : "No immediate escalation identified from the available evidence.",
    action: abstained
      ? "Supply the missing product information listed below and route the case to a qualified reviewer."
      : "Review the cited sources, confirm the product category and claim wording, and complete the prior-art and sourcing checks.",
    packet: {
      missingFacts: [
        ...classification.missingInformation,
        ...abs.missingInformation,
      ],
      suggestedQuestion: `For ${product.name}: is the preliminary category "${classification.signals["product_pathway"] ?? "unclear"}" correct given the submitted claims and the described preparation, and does the described process require a prior-art opinion before filing?`,
    },
  };

  if (review.level !== "none") {
    await supabaseAdmin.from("review_requests").insert({
      analysis_id: analysisRow.id,
      level: review.level,
      reason: review.reason,
      action: review.action,
      packet: review.packet,
    });
    await audit(caseRow.id, analysisRow.id, "review_requested", {
      level: review.level,
    });
  }

  const status = abstained ? "review" : "complete";
  const routes = {
    ip: pathways,
    compliance,
    tk,
    abs,
    markets,
    failures: failureStates,
  };
  await supabaseAdmin
    .from("analyses")
    .update({
      status,
      classification: classification.classifications as never,
      evidence: evidence as never,
      routes: routes as never,
      explanation: narrative as never,
      missing_information: missingInformation as never,
      confidence,
      confidence_label: confidenceLabel(confidence),
      abstained,
      review: review as never,
      updated_at: new Date().toISOString(),
    })
    .eq("id", analysisRow.id);
  await supabaseAdmin
    .from("cases")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", caseRow.id);
  await audit(caseRow.id, analysisRow.id, "analysis_completed", {
    confidence,
    status,
  });

  return {
    id: analysisRef,
    caseRef,
    product: submitted,
    date: new Date(caseRow.created_at).toISOString().slice(0, 10),
    updated: new Date().toISOString().slice(0, 10),
    status,
    confidence,
    confidenceLabel: confidenceLabel(confidence),
    abstained,
    classifications: classification.classifications,
    evidence,
    pathways,
    compliance,
    checklist: (checklistRows ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      status: row.status as Analysis["checklist"][number]["status"],
      priority: row.priority as Analysis["checklist"][number]["priority"],
      evidenceId: row.evidence_id ?? undefined,
      owner: row.owner ?? undefined,
      dueDate: row.due_date ?? undefined,
      notes: row.notes ?? undefined,
    })),
    review,
    tk,
    abs,
    markets,
    explanation: narrative,
    missingInformation,
    failureStates,
  };
}
