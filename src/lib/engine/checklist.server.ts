import type { ABSAssessment, ChecklistItem, Classification, ComplianceRoute, Evidence, IPPathway, TKScreening } from "@/types/domain";

export interface ChecklistInput {
  classifications: Classification[];
  pathways: IPPathway[];
  compliance: ComplianceRoute[];
  tk: TKScreening;
  abs: ABSAssessment;
  evidence: Evidence[];
  missingInformation: string[];
  confidence: number;
}

type Draft = Omit<ChecklistItem, "id"> & { position: number };

export function buildChecklist(input: ChecklistInput): Draft[] {
  const items: Draft[] = [];
  let position = 0;
  const add = (item: Omit<Draft, "position">) => items.push({ ...item, position: position++ });

  const pathway = input.classifications.find((c) => c.dimension === "Product pathway");
  add({
    title: "Confirm the product category",
    description: `Confirm the preliminary category "${pathway?.value ?? "Needs review"}" against the submitted composition, presentation and claims before any filing or licence application.`,
    status: "pending",
    priority: "High",
    evidenceId: input.evidence.find((e) => e.jurisdiction === "India")?.id,
  });

  const claim = input.classifications.find((c) => c.dimension === "Claim profile");
  add({
    title: "Review claim wording against the applicable conditions",
    description: `Each submitted claim must be reviewed against the applicable claim conditions for the confirmed category. Preliminary claim profile: ${claim?.value ?? "Unclear"}.`,
    status: "pending",
    priority: "High",
    evidenceId: input.evidence.find((e) => /claim/i.test(e.section))?.id,
  });

  if (input.pathways.some((p) => p.name === "Patent" && p.relevance === "Potentially relevant")) {
    add({
      title: "Commission a process-focused prior-art search",
      description: "Search patent and non-patent literature, including documented traditional knowledge, for the described process before any novelty opinion.",
      status: "pending",
      priority: "High",
      evidenceId: input.pathways.find((p) => p.name === "Patent")?.evidenceIds?.[0],
    });
  }

  add({
    title: "Screen trademark availability",
    description: "Screen the proposed product and range names on the register in the relevant classes for each target market.",
    status: "pending",
    priority: "Medium",
    evidenceId: input.pathways.find((p) => p.name === "Trademark")?.evidenceIds?.[0],
  });

  if (input.tk.reviewRequired) {
    add({
      title: "Complete traditional-knowledge prior-art screening",
      description: input.tk.verificationRoute,
      status: "pending",
      priority: "High",
      evidenceId: input.tk.knownEvidence[0],
    });
  }

  if (input.abs.relevance.startsWith("Potentially relevant")) {
    add({
      title: "Check access and benefit-sharing applicability",
      description: `${input.abs.verificationRequired}${input.abs.missingInformation.length ? ` Missing: ${input.abs.missingInformation.join("; ")}.` : ""}`,
      status: "pending",
      priority: input.abs.missingInformation.length ? "High" : "Medium",
      evidenceId: input.abs.evidenceIds?.[0],
    });
  }

  input.compliance
    .filter((route) => route.jurisdiction !== "India")
    .forEach((route) => {
      add({
        title: `Prepare ${route.jurisdiction} market screening`,
        description: `${route.pathway}. Relevant authority: ${route.authority}. ${route.uncertainty ?? ""}`.trim(),
        status: "pending",
        priority: "Low",
        evidenceId: route.evidenceIds?.[0],
      });
    });

  input.missingInformation.slice(0, 3).forEach((gap) => {
    add({
      title: `Supply missing information: ${gap.toLowerCase()}`,
      description: "This information is required before the assessment can move beyond a screening-level result.",
      status: "pending",
      priority: "Medium",
    });
  });

  if (input.confidence < 60) {
    add({
      title: "Request expert review",
      description: "Overall evidence confidence is below the threshold for a screening conclusion. Route the case to a qualified reviewer with the escalation packet.",
      status: "review",
      priority: "High",
    });
  }

  return items;
}
