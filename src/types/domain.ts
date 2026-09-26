export type Status = "complete" | "processing" | "pending" | "failed" | "review";

export type LanguageCode = "en" | "hi" | "mr";
export type MarketCode = "IN" | "EU" | "US" | "ASEAN" | "GLOBAL";
export type InformationStatus = "provided" | "not_provided" | "unknown" | "not_applicable";
export type EvidenceQuality = "VERIFIED" | "CURATED" | "SYNTHETIC" | "UNKNOWN";
export type EvidenceValidationStatus = "VALID" | "PARTIAL" | "INSUFFICIENT" | "UNVERIFIED" | "CONFLICTING";

export interface ApplicantInfo {
  name?: string;
  organisation?: string;
  email?: string;
  address?: string;
}

export type SupportLevel =
  | "supported"
  | "partially_supported"
  | "unsupported"
  | "conflicting"
  | "insufficient_evidence";

export interface Ingredient {
  id: string;
  commonName: string;
  scientificName: string;
  quantity: string;
  plantPart?: string;
  sourceStatus?: "cultivated" | "wild" | "unknown" | undefined;
  geographicSource?: string;
  supplier?: string;
}

export interface Claim {
  id: string;
  type: "Traditional use" | "Functional" | "Health" | "Cosmetic" | "Nutrition";
  text: string;
}

export interface Product {
  name: string;
  type: string;
  description: string;
  intendedUse: string;
  targetMarket: string;
  country: MarketCode;
  ingredients: Ingredient[];
  claims: Claim[];
  preparation: string;
  innovation: string;
  dosageForm?: string;
  traditionalReference?: string;
  markets?: MarketCode[];
  existingRegistration?: string;
  existingIP?: string;
  applicant?: ApplicantInfo;
  intakeStatus?: Partial<Record<string, InformationStatus>>;
  language?: LanguageCode;
}

export interface Classification {
  dimension: string;
  value: string;
  confidence: number;
  rationale: string;
  evidenceIds: string[];
  review?: boolean;
}

export interface Evidence {
  id: string;
  sourceId: string;
  documentId?: string;
  sourceType?: string;
  topic?: string;
  authority: string;
  title: string;
  section: string;
  page?: string | undefined;
  jurisdiction: string;
  effectiveDate: string;
  version: string;
  level: "Primary" | "Secondary";
  provision: string;
  relevance: string;
  url?: string | undefined;
  verified: boolean;
  evidenceQuality?: EvidenceQuality;
  verificationStatus?: string;
  validationStatus?: EvidenceValidationStatus;
  provenance?: {
    sourceId: string;
    documentId?: string;
    chunkId: string;
    sourceName: string;
    sourceUrl?: string;
    documentTitle?: string;
    section?: string;
    page?: string;
  };
  /** Transparent retrieval trace */
  retrieval?: {
    lexicalScore: number;
    semanticScore: number;
    authorityScore: number;
    jurisdictionMatch: boolean;
    fusedScore: number;
    rerankScore?: number;
    why: string;
  };
  validation?: {
    authorityOk: boolean;
    jurisdictionOk: boolean;
    currentnessOk: boolean;
    relevanceOk: boolean;
    citationOk: boolean;
    notes: string[];
    status?: EvidenceValidationStatus;
  };
}

export interface Source {
  id: string;
  name: string;
  authority: string;
  publisher: string;
  jurisdiction: string;
  version: string;
  effectiveDate: string;
  lastVerified: string;
  url?: string | undefined;
  topics: string[];
  recordCount: number;
  type: string;
  sourceType?: string;
  verificationStatus?: string;
}

export interface IPPathway {
  name: string;
  relevance: string;
  reason: string;
  nextStep: string;
  confidence: "High" | "Moderate" | "Needs review";
  evidenceIds?: string[];
}

export interface ComplianceRoute {
  jurisdiction: string;
  pathway: string;
  authority: string;
  checks: string[];
  evidenceIds?: string[];
  uncertainty?: string | undefined;
}

export interface TKScreening {
  relevance: string;
  reason: string;
  knownEvidence: string[];
  missingVerification: string[];
  verificationRoute: string;
  reviewRequired: boolean;
}

export interface ABSAssessment {
  relevance: string;
  reason: string;
  missingInformation: string[];
  verificationRequired: string;
  authority: string;
  evidenceIds?: string[];
}

export interface MarketScreening {
  market: string;
  potentialCategory: string;
  authority: string;
  missingInformation: string[];
  reviewStatus: string;
  evidenceIds?: string[];
}

export interface GroundedClaim {
  claim: string;
  supportingEvidence: string[];
  supportLevel: SupportLevel;
}

export interface Explanation {
  summary: string;
  claims: GroundedClaim[];
  uncertainties: string[];
  generated: boolean;
  guardNotes: string[];
}

export interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  status: Status;
  priority: "High" | "Medium" | "Low";
  evidenceId?: string | undefined;
  owner?: string | undefined;
  dueDate?: string | undefined;
  notes?: string | undefined;
}

export interface ReviewRequest {
  level: "recommended" | "required" | "none";
  reason: string;
  action: string;
  packet?: {
    missingFacts: string[];
    suggestedQuestion: string;
  };
  status?: string;
}

export interface AuditEvent {
  id: string;
  eventType: string;
  detail: Record<string, string | number | boolean | null>;
  createdAt: string;
}

export interface Analysis {
  id: string;
  caseRef?: string | undefined;
  product: Product;
  date: string;
  updated: string;
  status: Status;
  confidence: number;
  confidenceLabel: string;
  abstained?: boolean | undefined;
  classifications: Classification[];
  evidence: Evidence[];
  pathways: IPPathway[];
  compliance: ComplianceRoute[];
  checklist: ChecklistItem[];
  review: ReviewRequest;
  tk?: TKScreening | undefined;
  abs?: ABSAssessment | undefined;
  markets?: MarketScreening[] | undefined;
  explanation?: Explanation | undefined;
  missingInformation?: string[] | undefined;
  failureStates?: FailureState[] | undefined;
  audit?: AuditEvent[] | undefined;
}

export interface Case {
  id: string;
  product: string;
  classification: string;
  confidence: number;
  status: Status;
  created: string;
  updated: string;
  reviewer: string;
  analysisId: string;
}

export type ErrorCode =
  | "AUTH_REQUIRED"
  | "INSUFFICIENT_PRODUCT_DATA"
  | "NO_EVIDENCE"
  | "VECTOR_UNAVAILABLE"
  | "LLM_UNAVAILABLE"
  | "TRANSLATION_UNAVAILABLE"
  | "CONFLICTING_EVIDENCE"
  | "HUMAN_REVIEW_REQUIRED"
  | "VALIDATION_ERROR"
  | "SOURCE_NOT_FOUND"
  | "INSUFFICIENT_EVIDENCE"
  | "JURISDICTION_UNCLEAR"
  | "TRANSLATION_FAILED"
  | "RETRIEVAL_FAILED"
  | "LLM_FAILED"
  | "ANALYSIS_FAILED"
  | "DATABASE_ERROR";

export interface FailureState {
  code: ErrorCode;
  message: string;
  recoverable: boolean;
}
