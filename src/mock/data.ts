import type { Analysis, Case, Evidence, Source } from "@/types/domain";

export const evidence: Evidence[] = [
  {
    id: "EVD-1042",
    sourceId: "SRC-FSSAI-01",
    authority: "Food Safety and Standards Authority of India",
    title: "Food Safety and Standards (Ayurveda Aahara) Regulations, 2022",
    section: "Regulation 4",
    page: "6–8",
    jurisdiction: "India",
    effectiveDate: "2022-05-05",
    version: "2022 notification",
    level: "Primary",
    provision:
      "Sets conditions for food prepared according to authoritative Ayurveda texts and limits the category's presentation and claims.",
    relevance:
      "The beverage format and referenced traditional preparation require review against the Ayurveda Aahara category conditions.",
    url: "https://www.fssai.gov.in/",
    verified: true,
  },
  {
    id: "EVD-1098",
    sourceId: "SRC-AYUSH-02",
    authority: "Ministry of Ayush",
    title: "Ayurvedic Pharmacopoeia of India",
    section: "Part I, Vol. I — Ashwagandha",
    page: "19–21",
    jurisdiction: "India",
    effectiveDate: "1989-01-01",
    version: "First edition",
    level: "Primary",
    provision:
      "Provides the recognized identity and quality description for Withania somnifera root.",
    relevance:
      "Supports ingredient identity, but does not independently validate the finished product classification or claims.",
    verified: true,
  },
  {
    id: "EVD-1131",
    sourceId: "SRC-TKDL-03",
    authority: "Traditional Knowledge Digital Library",
    title: "Traditional knowledge prior-art reference",
    section: "Search record summary",
    jurisdiction: "India",
    effectiveDate: "2026-09-12",
    version: "Index snapshot",
    level: "Secondary",
    provision:
      "Indexed traditional-use references may be relevant to novelty and inventive-step review.",
    relevance:
      "A prior-art search is recommended before assessing patent relevance for the modified extraction process.",
    verified: false,
  },
];

export const sources: Source[] = [
  {
    id: "SRC-FSSAI-01",
    name: "Ayurveda Aahara Regulations",
    authority: "Official",
    publisher: "Food Safety and Standards Authority of India",
    jurisdiction: "India",
    version: "2022 notification",
    effectiveDate: "2022-05-05",
    lastVerified: "2026-09-18",
    url: "https://www.fssai.gov.in/",
    topics: ["Food classification", "Claims", "Labelling"],
    recordCount: 34,
    type: "Regulation",
  },
  {
    id: "SRC-AYUSH-02",
    name: "Ayurvedic Pharmacopoeia of India",
    authority: "Official",
    publisher: "Ministry of Ayush",
    jurisdiction: "India",
    version: "Part I collection",
    effectiveDate: "1989-01-01",
    lastVerified: "2026-09-14",
    topics: ["Ingredient identity", "Formulations"],
    recordCount: 186,
    type: "Pharmacopoeia",
  },
  {
    id: "SRC-TKDL-03",
    name: "Traditional Knowledge Digital Library index",
    authority: "Needs review",
    publisher: "CSIR and Ministry of Ayush",
    jurisdiction: "India",
    version: "Index snapshot",
    effectiveDate: "2026-09-12",
    lastVerified: "2026-09-12",
    topics: ["Prior art", "Traditional knowledge"],
    recordCount: 72,
    type: "Knowledge base",
  },
];

const product = {
  name: "Ashwagandha Herbal Beverage",
  type: "Herbal beverage",
  description:
    "A ready-to-drink beverage containing standardized ashwagandha root extract and traditional spices.",
  intendedUse: "Daily wellness support",
  targetMarket: "Adults seeking traditional wellness products",
  country: "India",
  ingredients: [
    {
      id: "ING-1",
      commonName: "Ashwagandha root extract",
      scientificName: "Withania somnifera",
      quantity: "300 mg / 200 ml",
    },
    {
      id: "ING-2",
      commonName: "Ginger",
      scientificName: "Zingiber officinale",
      quantity: "50 mg / 200 ml",
    },
  ],
  claims: [
    {
      id: "CLM-1",
      type: "Traditional use" as const,
      text: "Traditionally used to support vitality",
    },
    {
      id: "CLM-2",
      type: "Functional" as const,
      text: "Supports everyday resilience",
    },
  ],
  preparation:
    "Aqueous extraction, filtration, blending and hot-fill bottling.",
  innovation: "Standardized extraction ratio and shelf-stable beverage format.",
};

export const analysis: Analysis = {
  id: "IPS-2026-00124",
  product: product as Analysis["product"],
  date: "2026-09-18",
  updated: "2026-09-20",
  status: "complete",
  confidence: 82,
  confidenceLabel: "High confidence",
  evidence,
  classifications: [
    {
      dimension: "Product pathway",
      value: "Ayurveda Aahara",
      confidence: 84,
      rationale:
        "The composition and intended use align with an Ayurveda-derived food pathway, subject to formulation and claims review.",
      evidenceIds: ["EVD-1042", "EVD-1098"],
    },
    {
      dimension: "Claim profile",
      value: "Mixed claims",
      confidence: 78,
      rationale:
        "The submitted wording combines traditional-use context with a functional wellness claim.",
      evidenceIds: ["EVD-1042"],
      review: true,
    },
    {
      dimension: "Innovation profile",
      value: "Modified formulation",
      confidence: 81,
      rationale:
        "A traditional botanical is presented through a standardized extraction and shelf-stable beverage process.",
      evidenceIds: ["EVD-1098", "EVD-1131"],
    },
    {
      dimension: "IP relevance",
      value: "Prior-art review recommended",
      confidence: 72,
      rationale:
        "Traditional-knowledge references may affect novelty; process-specific features need a focused search.",
      evidenceIds: ["EVD-1131"],
      review: true,
    },
  ],
  pathways: [
    {
      name: "Patent",
      relevance: "Potentially relevant",
      reason:
        "The extraction or stabilization process may contain protectable technical features.",
      nextStep:
        "Run a process-focused prior-art search before novelty assessment.",
      confidence: "Needs review",
    },
    {
      name: "Trademark",
      relevance: "Potentially relevant",
      reason:
        "The product and range names may function as commercial source identifiers.",
      nextStep: "Confirm mark availability in target classes and markets.",
      confidence: "Moderate",
    },
    {
      name: "Traditional Knowledge",
      relevance: "Review recommended",
      reason:
        "Core botanical use appears in established traditional-knowledge records.",
      nextStep:
        "Map submitted claims and formulation changes against cited records.",
      confidence: "High",
    },
  ],
  compliance: [
    {
      jurisdiction: "India",
      pathway: "Food / Ayurveda Aahara pathway",
      authority: "FSSAI, with specialist Ayush review where applicable",
      checks: [
        "Confirm category eligibility",
        "Review ingredient schedules",
        "Assess claim and label wording",
        "Verify manufacturing and licence requirements",
      ],
    },
    {
      jurisdiction: "EU",
      pathway: "Food supplement / novel food screening",
      authority: "Relevant national competent authority",
      checks: [
        "Confirm ingredient history of use",
        "Review permitted claims",
        "Check market-specific notification duties",
      ],
    },
  ],
  checklist: [
    {
      id: "CHK-1",
      title: "Confirm ingredient identity",
      description:
        "Reconcile supplier specifications with recognized botanical identity.",
      status: "complete",
      priority: "High",
      evidenceId: "EVD-1098",
      owner: "R. Mehta",
      dueDate: "2026-09-22",
    },
    {
      id: "CHK-2",
      title: "Verify applicable product category",
      description:
        "Confirm Ayurveda Aahara eligibility against the submitted preparation.",
      status: "complete",
      priority: "High",
      evidenceId: "EVD-1042",
      owner: "A. Kulkarni",
      dueDate: "2026-09-23",
    },
    {
      id: "CHK-3",
      title: "Review applicable claim requirements",
      description: "Assess each proposed claim and supporting evidence.",
      status: "processing",
      priority: "High",
      evidenceId: "EVD-1042",
      owner: "A. Kulkarni",
      dueDate: "2026-09-25",
    },
    {
      id: "CHK-4",
      title: "Conduct prior-art search",
      description:
        "Search traditional knowledge and patent literature for the stated process.",
      status: "pending",
      priority: "Medium",
      evidenceId: "EVD-1131",
      dueDate: "2026-09-29",
    },
    {
      id: "CHK-5",
      title: "Confirm trademark availability",
      description: "Screen the proposed mark in relevant goods classes.",
      status: "pending",
      priority: "Medium",
      dueDate: "2026-10-02",
    },
    {
      id: "CHK-6",
      title: "Expert review",
      description:
        "Confirm classification and claims before regulatory submission.",
      status: "review",
      priority: "High",
      dueDate: "2026-10-04",
    },
  ],
  review: {
    level: "recommended",
    reason:
      "The available evidence supports a likely product pathway, but mixed claims and process novelty require professional judgment.",
    action:
      "Review the cited sources and confirm classification, claim wording, and prior-art scope.",
  },
};

export const cases: Case[] = [
  {
    id: "CASE-0241",
    product: "Ashwagandha Herbal Beverage",
    classification: "Ayurveda Aahara",
    confidence: 82,
    status: "complete",
    created: "2026-09-18",
    updated: "2026-09-20",
    reviewer: "A. Kulkarni",
    analysisId: analysis.id,
  },
  {
    id: "CASE-0238",
    product: "Brahmi Focus Capsules",
    classification: "Ayurvedic formulation",
    confidence: 76,
    status: "review",
    created: "2026-09-14",
    updated: "2026-09-19",
    reviewer: "R. Mehta",
    analysisId: analysis.id,
  },
  {
    id: "CASE-0232",
    product: "Neem Scalp Serum",
    classification: "Cosmetic",
    confidence: 88,
    status: "complete",
    created: "2026-09-09",
    updated: "2026-09-17",
    reviewer: "S. Iyer",
    analysisId: analysis.id,
  },
  {
    id: "CASE-0229",
    product: "Turmeric Recovery Blend",
    classification: "Unclear",
    confidence: 61,
    status: "processing",
    created: "2026-09-07",
    updated: "2026-09-16",
    reviewer: "Unassigned",
    analysisId: analysis.id,
  },
];
