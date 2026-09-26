import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { normalizeMarketCode } from "@/lib/markets";
import { AppError } from "@/lib/errors";
import { ownedCaseInsert } from "@/lib/ownership";
import type {
  Analysis,
  AuditEvent,
  Case,
  Evidence,
  Source,
} from "@/types/domain";

const ingredientSchema = z.object({
  id: z.string(),
  commonName: z.string().min(1),
  scientificName: z.string().default(""),
  quantity: z.string().default(""),
  plantPart: z.string().optional(),
  sourceStatus: z.enum(["cultivated", "wild", "unknown"]).optional(),
  geographicSource: z.string().optional(),
  supplier: z.string().optional(),
});

const claimSchema = z.object({
  id: z.string(),
  type: z.enum([
    "Traditional use",
    "Functional",
    "Health",
    "Cosmetic",
    "Nutrition",
  ]),
  text: z.string().min(1),
});

export const productSchema = z.object({
  name: z.string().min(2),
  type: z.string().min(1),
  description: z.string().default(""),
  intendedUse: z.string().default(""),
  targetMarket: z.string().default(""),
  country: z
    .preprocess(
      (value) => normalizeMarketCode(String(value ?? "")),
      z.enum(["IN", "EU", "US", "ASEAN", "GLOBAL"]),
    )
    .default("IN"),
  ingredients: z.array(ingredientSchema).default([]),
  claims: z.array(claimSchema).default([]),
  preparation: z.string().default(""),
  innovation: z.string().default(""),
  dosageForm: z.string().optional(),
  traditionalReference: z.string().optional(),
  markets: z
    .array(
      z.preprocess(
        (value) => normalizeMarketCode(String(value ?? "")),
        z.enum(["IN", "EU", "US", "ASEAN", "GLOBAL"]),
      ),
    )
    .default([]),
  existingRegistration: z.string().optional(),
  existingIP: z.string().optional(),
  applicant: z
    .object({
      name: z.string().optional(),
      organisation: z.string().optional(),
      email: z.string().email().optional(),
      address: z.string().optional(),
    })
    .optional(),
  intakeStatus: z
    .record(z.enum(["provided", "not_provided", "unknown", "not_applicable"]))
    .optional(),
  language: z.enum(["en", "hi", "mr"]).optional(),
});

export const createAnalysis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => productSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { ensureEmbeddings } = await import("@/lib/engine/ingest.server");
    const { runAnalysis } = await import("@/lib/engine/pipeline.server");
    await ensureEmbeddings();
    try {
      return await runAnalysis(
        data as never,
        data.language ?? "en",
        context.userId,
      );
    } catch (error) {
      console.error("analysis failed", error);
      if (error instanceof AppError) throw error;
      throw new AppError(
        "ANALYSIS_FAILED",
        "The analysis could not be completed.",
      );
    }
  });

export const getAnalysis = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string() }).parse(input))
  .handler(async ({ data, context }): Promise<Analysis | null> => {
    const { supabaseAdmin } =
      await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("analyses")
      .select("*, cases!inner(*)")
      .eq("analysis_ref", data.id)
      .eq("cases.user_id", context.userId)
      .maybeSingle();
    if (!row) return null;
    const { data: checklist } = await supabaseAdmin
      .from("checklist_items")
      .select("*")
      .eq("analysis_id", row.id)
      .order("position");
    const { data: events } = await supabaseAdmin
      .from("audit_events")
      .select("*")
      .eq("analysis_id", row.id)
      .order("created_at");
    const routes = (row.routes ?? {}) as Record<string, unknown>;
    const caseRow = row.cases as unknown as {
      case_ref: string;
      product: unknown;
      created_at: string;
    };
    return {
      id: row.analysis_ref,
      caseRef: caseRow?.case_ref,
      product: caseRow?.product as unknown as Analysis["product"],
      date: String(row.created_at).slice(0, 10),
      updated: String(row.updated_at).slice(0, 10),
      status: row.status as Analysis["status"],
      confidence: Number(row.confidence ?? 0),
      confidenceLabel: row.confidence_label ?? "Low confidence",
      abstained: row.abstained,
      classifications: (row.classification ??
        []) as unknown as Analysis["classifications"],
      evidence: (row.evidence ?? []) as unknown as Evidence[],
      pathways: (routes["ip"] ?? []) as Analysis["pathways"],
      compliance: (routes["compliance"] ?? []) as Analysis["compliance"],
      tk: routes["tk"] as Analysis["tk"],
      abs: routes["abs"] as Analysis["abs"],
      markets: routes["markets"] as Analysis["markets"],
      failureStates: (routes["failures"] ?? []) as Analysis["failureStates"],
      explanation: row.explanation as unknown as Analysis["explanation"],
      missingInformation: (row.missing_information ??
        []) as unknown as string[],
      review: (row.review ?? {
        level: "none",
        reason: "",
        action: "",
      }) as unknown as Analysis["review"],
      checklist: (checklist ?? []).map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        status: item.status as Analysis["checklist"][number]["status"],
        priority: item.priority as Analysis["checklist"][number]["priority"],
        evidenceId: item.evidence_id ?? undefined,
        owner: item.owner ?? undefined,
        dueDate: item.due_date ?? undefined,
        notes: item.notes ?? undefined,
      })),
      audit: (events ?? []).map((event): AuditEvent => ({
        id: event.id,
        eventType: event.event_type,
        detail: (event.detail ?? {}) as AuditEvent["detail"],
        createdAt: String(event.created_at),
      })),
    };
  });

export const listCases = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Case[]> => {
    const { supabaseAdmin } =
      await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("cases")
      .select("*, analyses(analysis_ref, confidence, classification, status)")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(50);
    return (data ?? []).map((row) => {
      const analysis = (
        row.analyses as unknown as {
          analysis_ref: string;
          confidence: number;
          classification: unknown[];
          status: string;
        }[]
      )?.[0];
      const classification = (
        analysis?.classification as
          { dimension: string; value: string }[] | undefined
      )?.find((c) => c.dimension === "Product pathway");
      const product = row.product as { name?: string };
      return {
        id: row.case_ref,
        product: product?.name ?? "Untitled product",
        classification: classification?.value ?? "Pending",
        confidence: Number(analysis?.confidence ?? 0),
        status: row.status as Case["status"],
        created: String(row.created_at).slice(0, 10),
        updated: String(row.updated_at).slice(0, 10),
        reviewer: row.reviewer ?? "Unassigned",
        analysisId: analysis?.analysis_ref ?? "",
      };
    });
  });

export const listEvidence = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ query: z.string().default("") }).parse(input ?? {}),
  )
  .handler(async ({ data }): Promise<Evidence[]> => {
    const { supabaseAdmin } =
      await import("@/integrations/supabase/client.server");
    let ids: string[] | null = null;
    if (data.query.trim()) {
      const { data: hits } = await supabaseAdmin.rpc("bm25_evidence", {
        query_text: data.query,
        match_count: 30,
      });
      ids = (hits ?? []).map((h: { id: string }) => h.id);
    }
    const base = supabaseAdmin
      .from("evidence_chunks")
      .select("*, sources(*), documents(*)")
      .limit(60);
    const { data: rows } = ids
      ? await base.in("id", ids.length ? ids : ["none"])
      : await base;
    return (rows ?? []).map((row) => {
      const source = row.sources as unknown as {
        name: string;
        publisher: string;
        official_url: string | null;
        verification_status: string;
        source_type?: string;
      };
      return {
        id: row.id,
        sourceId: row.source_id,
        documentId: row.document_id,
        sourceType: row.source_type ?? source?.source_type ?? "unknown",
        topic: row.topic,
        authority: source?.publisher ?? "",
        title: source?.name ?? "",
        section: row.section,
        page: row.page ?? undefined,
        jurisdiction: row.jurisdiction,
        effectiveDate: row.effective_date ?? "Not stated",
        version: row.version,
        level: row.authority_level <= 2 ? "Primary" : "Secondary",
        provision: row.text,
        relevance: `Indexed under ${row.topic}. Tags: ${(row.tags ?? []).join(", ")}.`,
        url: source?.official_url ?? undefined,
        verified:
          source?.verification_status === "verified" &&
          row.evidence_quality === "VERIFIED",
        evidenceQuality: (row.evidence_quality ?? "UNKNOWN") as NonNullable<
          Evidence["evidenceQuality"]
        >,
        verificationStatus:
          row.verification_status ?? source?.verification_status ?? "unknown",
        provenance: {
          sourceId: row.source_id,
          documentId: row.document_id,
          chunkId: row.id,
          sourceName: source?.name ?? "",
          ...(source?.official_url ? { sourceUrl: source.official_url } : {}),
          documentTitle:
            (row.documents as { title?: string } | null)?.title ??
            source?.name ??
            "",
          section: row.section,
          ...(row.page ? { page: row.page } : {}),
        },
      } satisfies Evidence;
    });
  });

export const getEvidenceItem = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ id: z.string() }).parse(input))
  .handler(async ({ data }): Promise<Evidence | null> => {
    const { supabaseAdmin } =
      await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("evidence_chunks")
      .select("*, sources(*), documents(*)")
      .eq("id", data.id)
      .maybeSingle();
    if (!row) return null;
    const source = row.sources as unknown as {
      name: string;
      publisher: string;
      official_url: string | null;
      verification_status: string;
      source_type?: string;
    };
    return {
      id: row.id,
      sourceId: row.source_id,
      documentId: row.document_id,
      sourceType: row.source_type ?? source?.source_type ?? "unknown",
      topic: row.topic,
      authority: source?.publisher ?? "",
      title: source?.name ?? "",
      section: row.section,
      page: row.page ?? undefined,
      jurisdiction: row.jurisdiction,
      effectiveDate: row.effective_date ?? "Not stated",
      version: row.version,
      level: row.authority_level <= 2 ? "Primary" : "Secondary",
      provision: row.text,
      relevance: `Indexed under ${row.topic}. Tags: ${(row.tags ?? []).join(", ")}.`,
      url: source?.official_url ?? undefined,
      verified:
        source?.verification_status === "verified" &&
        row.evidence_quality === "VERIFIED",
      evidenceQuality: (row.evidence_quality ?? "UNKNOWN") as NonNullable<
        Evidence["evidenceQuality"]
      >,
      verificationStatus:
        row.verification_status ?? source?.verification_status ?? "unknown",
      provenance: {
        sourceId: row.source_id,
        documentId: row.document_id,
        chunkId: row.id,
        sourceName: source?.name ?? "",
        ...(source?.official_url ? { sourceUrl: source.official_url } : {}),
        documentTitle:
          (row.documents as { title?: string } | null)?.title ??
          source?.name ??
          "",
        section: row.section,
        ...(row.page ? { page: row.page } : {}),
      },
    };
  });

export const listSources = createServerFn({ method: "GET" }).handler(
  async (): Promise<Source[]> => {
    const { supabaseAdmin } =
      await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("sources")
      .select("*, evidence_chunks(count)")
      .order("authority_level");
    return (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      authority: row.authority_label,
      publisher: row.publisher,
      jurisdiction: row.jurisdiction,
      version: row.version,
      effectiveDate: row.effective_date ?? "Not stated",
      lastVerified: String(row.retrieved_at).slice(0, 10),
      url: row.official_url ?? undefined,
      sourceType: row.source_type ?? "unknown",
      verificationStatus: row.verification_status ?? "unknown",
      topics: row.topics ?? [],
      recordCount:
        (row.evidence_chunks as unknown as { count: number }[])?.[0]?.count ??
        0,
      type: row.document_type,
    }));
  },
);

export const updateChecklistItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string(),
        status: z.enum([
          "complete",
          "processing",
          "pending",
          "failed",
          "review",
        ]),
        analysisRef: z.string(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } =
      await import("@/integrations/supabase/client.server");
    const { data: analysis } = await supabaseAdmin
      .from("analyses")
      .select("id, case_id, cases!inner(user_id)")
      .eq("analysis_ref", data.analysisRef)
      .eq("cases.user_id", context.userId)
      .maybeSingle();
    if (!analysis)
      throw new AppError(
        "SOURCE_NOT_FOUND",
        "The requested analysis was not found.",
        false,
      );
    const { data: updated } = await supabaseAdmin
      .from("checklist_items")
      .update({ status: data.status, updated_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("analysis_id", analysis.id)
      .select("id")
      .maybeSingle();
    if (updated) {
      await supabaseAdmin.from("audit_events").insert({
        case_id: analysis.case_id,
        analysis_id: analysis.id,
        event_type: "checklist_updated",
        detail: { item: data.id, status: data.status },
      });
    }
    return { ok: true };
  });

export const requestExpertReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({ analysisRef: z.string(), note: z.string().default("") })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } =
      await import("@/integrations/supabase/client.server");
    const { data: analysis } = await supabaseAdmin
      .from("analyses")
      .select("id, case_id, review, cases!inner(user_id)")
      .eq("analysis_ref", data.analysisRef)
      .eq("cases.user_id", context.userId)
      .maybeSingle();
    if (!analysis)
      throw new AppError(
        "SOURCE_NOT_FOUND",
        "The requested analysis was not found.",
        false,
      );
    const review = (analysis.review ?? {}) as {
      reason?: string;
      action?: string;
      packet?: unknown;
    };
    await supabaseAdmin.from("review_requests").insert({
      analysis_id: analysis.id,
      level: "required",
      reason: review.reason ?? "Requested from the analysis screen.",
      action:
        data.note ||
        (review.action ?? "Expert review requested by the case owner."),
      packet: (review.packet ?? {}) as never,
      status: "open",
      requested_by: "case owner",
    });
    await supabaseAdmin
      .from("cases")
      .update({ status: "review" })
      .eq("id", analysis.case_id);
    await supabaseAdmin
      .from("audit_events")
      .insert({
        case_id: analysis.case_id,
        analysis_id: analysis.id,
        event_type: "review_requested",
        detail: { note: data.note },
      });
    return { ok: true };
  });

export const getOverviewStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } =
      await import("@/integrations/supabase/client.server");
    const [cases, sources, evidence, reviews] = await Promise.all([
      supabaseAdmin
        .from("cases")
        .select("id, status", { count: "exact" })
        .eq("user_id", context.userId),
      supabaseAdmin
        .from("sources")
        .select("id", { count: "exact", head: true }),
      supabaseAdmin
        .from("evidence_chunks")
        .select("id", { count: "exact", head: true }),
      supabaseAdmin
        .from("review_requests")
        .select("id, analyses!inner(cases!inner(user_id))", {
          count: "exact",
          head: true,
        })
        .eq("status", "open")
        .eq("analyses.cases.user_id", context.userId),
    ]);
    const rows = cases.data ?? [];
    return {
      activeAnalyses: rows.filter((r) => r.status === "processing").length,
      evidenceSources: sources.count ?? 0,
      evidenceRecords: evidence.count ?? 0,
      pendingReviews: reviews.count ?? 0,
      completedAnalyses: rows.filter((r) => r.status === "complete").length,
    };
  });

export const reindexCorpus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { ensureEmbeddings } = await import("@/lib/engine/ingest.server");
    return ensureEmbeddings();
  });
