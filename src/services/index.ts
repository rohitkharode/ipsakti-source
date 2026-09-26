import {
  createAnalysis,
  getAnalysis,
  getEvidenceItem,
  getOverviewStats,
  listCases,
  listEvidence,
  listSources,
  reindexCorpus,
  requestExpertReview,
  updateChecklistItem,
} from "@/lib/api.functions";
import type { Analysis, Product, Status } from "@/types/domain";

/**
 * The UI only talks to these services. Each one is a thin wrapper around a
 * typed server function, so the transport can change without touching components.
 */
export const analysisService = {
  get: (id: string) => getAnalysis({ data: { id } }),
  create: (product: Product) => createAnalysis({ data: product as never }) as Promise<Analysis>,
  stats: () => getOverviewStats(),
};

export const evidenceService = {
  list: (query = "") => listEvidence({ data: { query } }),
  get: (id: string) => getEvidenceItem({ data: { id } }),
  reindex: () => reindexCorpus(),
};

export const caseService = {
  list: () => listCases(),
};

export const sourceService = {
  list: () => listSources(),
  get: async (id: string) => (await listSources()).find((item) => item.id === id) ?? null,
};

export const checklistService = {
  update: (id: string, status: Status, analysisRef: string) => updateChecklistItem({ data: { id, status, analysisRef } }),
};

export const reviewService = {
  request: (analysisRef: string, note = "") => requestExpertReview({ data: { analysisRef, note } }),
};
