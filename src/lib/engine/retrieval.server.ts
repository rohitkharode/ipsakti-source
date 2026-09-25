import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { marketJurisdiction, normalizeMarketCode } from "@/lib/markets";
import type { Evidence, EvidenceQuality, MarketCode } from "@/types/domain";

export interface ChunkRow {
  id: string;
  source_id: string;
  section: string;
  page: string | null;
  topic: string;
  tags: string[];
  jurisdiction: string;
  effective_date: string | null;
  version: string;
  authority_level: number;
  text: string;
  document_id: string;
  evidence_quality?: EvidenceQuality;
  verification_status?: string;
  source_type?: string;
  market_scope?: string[];
  document_title?: string;
}

const AUTHORITY_LABEL: Record<number, string> = {
  1: "Primary official source",
  2: "Official regulatory publication",
  3: "Official government guidance",
  4: "Recognized institutional source",
  5: "Secondary reference",
};

export async function embedQuery(text: string): Promise<number[] | null> {
  // No embedding provider is configured in this migration. Keep the vector
  // branch optional so BM25 remains a safe deterministic fallback.
  void text;
  return null;
}

/** BM25-style lexical retrieval over the Postgres full-text index. */
async function lexicalSearch(query: string, limit: number) {
  const { data, error } = await supabaseAdmin.rpc("bm25_evidence", { query_text: query, match_count: limit });
  if (error) {
    console.error("lexical search failed", error.message);
    return [] as { id: string; score: number }[];
  }
  return (data ?? []) as { id: string; score: number }[];
}

async function vectorSearch(query: string, limit: number) {
  const embedding = await embedQuery(query);
  if (!embedding) return [] as { id: string; similarity: number }[];
  const { data, error } = await supabaseAdmin.rpc("match_evidence", {
    query_embedding: embedding as unknown as string,
    match_count: limit,
  });
  if (error) {
    console.error("vector search failed", error.message);
    return [] as { id: string; similarity: number }[];
  }
  return (data ?? []) as { id: string; similarity: number }[];
}

export interface RetrievedChunk {
  chunk: ChunkRow;
  lexicalScore: number;
  semanticScore: number;
  authorityScore: number;
  jurisdictionMatch: boolean;
  fusedScore: number;
  rerankScore: number;
  why: string;
}

/** Hybrid retrieval: BM25 + vector, transparent weighted rank fusion. */
export async function hybridRetrieve(options: {
  queries: string[];
  jurisdictions?: string[];
  marketCodes?: MarketCode[];
  topics?: string[];
  limit?: number;
}): Promise<RetrievedChunk[]> {
  const limit = options.limit ?? 8;
  const markets = (options.marketCodes ?? options.jurisdictions ?? ["GLOBAL"]).map(normalizeMarketCode);
  const targetJurisdictions = new Set(markets.map(marketJurisdiction));
  const lexical = new Map<string, number>();
  const semantic = new Map<string, number>();

  for (const query of options.queries) {
    const [lex, vec] = await Promise.all([lexicalSearch(query, 10), vectorSearch(query, 10)]);
    lex.forEach((row) => lexical.set(row.id, Math.max(lexical.get(row.id) ?? 0, row.score)));
    vec.forEach((row) => semantic.set(row.id, Math.max(semantic.get(row.id) ?? 0, row.similarity)));
  }

  const ids = [...new Set([...lexical.keys(), ...semantic.keys()])];
  if (ids.length === 0) return [];

  const { data, error } = await supabaseAdmin.from("evidence_chunks").select("*, sources(*), documents(*)").in("id", ids);
  if (error || !data) {
    console.error("chunk fetch failed", error?.message);
    return [];
  }

  const maxLex = Math.max(0.0001, ...[...lexical.values()]);
  const scored: RetrievedChunk[] = (data as unknown as (ChunkRow & { sources?: { source_type?: string }; documents?: { title?: string } })[])
    .map((row) => ({ ...row, ...(row.documents?.title ? { document_title: row.documents.title } : {}) }))
    .filter((chunk) => targetJurisdictions.has(chunk.jurisdiction) || chunk.jurisdiction === "Global")
    .map((chunk) => {
    const lexicalScore = (lexical.get(chunk.id) ?? 0) / maxLex;
    const semanticScore = semantic.get(chunk.id) ?? 0;
    const authorityScore = Math.max(0, 1 - (chunk.authority_level - 1) * 0.18);
    const jurisdictionMatch = targetJurisdictions.has(chunk.jurisdiction) || chunk.jurisdiction === "Global";
    const topicMatch = options.topics?.includes(chunk.topic) ? 1 : 0;
    const currentness = chunk.effective_date ? 1 : 0.6;
    const sourceType = chunk.source_type ?? chunk.sources?.source_type ?? "curated_internal";
    const sourceTypeScore = sourceType.startsWith("official") ? 1 : sourceType === "recognized_institution" ? 0.75 : sourceType === "secondary_reference" ? 0.5 : 0.25;
    const qualityScore = chunk.evidence_quality === "VERIFIED" ? 1 : chunk.evidence_quality === "CURATED" ? 0.55 : chunk.evidence_quality === "SYNTHETIC" ? 0 : 0.25;

    const fusedScore =
      lexicalScore * 0.3 +
      semanticScore * 0.3 +
      authorityScore * 0.2 +
      (jurisdictionMatch ? 0.12 : 0) +
      topicMatch * 0.05 +
      currentness * 0.03;

    // Explainable second-pass reranking. The weights are deliberately fixed
    // and documented so this remains ranking signal, not legal confidence.
    const rerankScore =
      lexicalScore * 0.25 +
      semanticScore * 0.25 +
      authorityScore * 0.2 +
      (jurisdictionMatch ? 0.15 : 0) +
      currentness * 0.08 +
      sourceTypeScore * 0.04 +
      qualityScore * 0.03;

    const reasons: string[] = [];
    if (lexicalScore > 0) reasons.push("keyword match on the submitted terminology");
    if (semanticScore > 0) reasons.push("semantic similarity to the assessment query");
    if (jurisdictionMatch) reasons.push(`jurisdiction match (${chunk.jurisdiction})`);
    reasons.push(`${AUTHORITY_LABEL[chunk.authority_level] ?? "Source"} authority weighting`);
    if (sourceType.startsWith("official")) reasons.push("official source type");
    if (chunk.evidence_quality === "CURATED") reasons.push("curated evidence quality; source passage verification required");

    return { chunk, lexicalScore, semanticScore, authorityScore, jurisdictionMatch, fusedScore, rerankScore, why: `Retrieved and reranked by ${reasons.join(", ")}.` };
  });

  return scored.sort((a, b) => b.rerankScore - a.rerankScore).slice(0, limit);
}

export function toEvidence(item: RetrievedChunk, source: { name: string; publisher: string; official_url: string | null; verification_status: string; source_type?: string }): Evidence {
  const { chunk } = item;
  return {
    id: chunk.id,
    sourceId: chunk.source_id,
    documentId: chunk.document_id,
    sourceType: chunk.source_type ?? source.source_type ?? "curated_internal",
    topic: chunk.topic,
    authority: source.publisher,
    title: source.name,
    section: chunk.section,
    page: chunk.page ?? undefined,
    jurisdiction: chunk.jurisdiction,
    effectiveDate: chunk.effective_date ?? "Not stated",
    version: chunk.version,
    level: chunk.authority_level <= 2 ? "Primary" : "Secondary",
    provision: chunk.text,
    relevance: item.why,
    url: source.official_url ?? undefined,
    verified: source.verification_status === "verified" && chunk.evidence_quality === "VERIFIED",
    evidenceQuality: chunk.evidence_quality ?? "UNKNOWN",
    verificationStatus: chunk.verification_status ?? source.verification_status,
    provenance: {
      sourceId: chunk.source_id,
      documentId: chunk.document_id,
      chunkId: chunk.id,
      sourceName: source.name,
      ...(source.official_url ? { sourceUrl: source.official_url } : {}),
      documentTitle: chunk.document_title ?? source.name,
      section: chunk.section,
      ...(chunk.page ? { page: chunk.page } : {}),
    },
    retrieval: {
      lexicalScore: Number(item.lexicalScore.toFixed(3)),
      semanticScore: Number(item.semanticScore.toFixed(3)),
      authorityScore: Number(item.authorityScore.toFixed(3)),
      jurisdictionMatch: item.jurisdictionMatch,
      fusedScore: Number(item.fusedScore.toFixed(3)),
      rerankScore: Number(item.rerankScore.toFixed(3)),
      why: item.why,
    },
  };
}
