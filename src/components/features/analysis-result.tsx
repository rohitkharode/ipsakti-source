import {
  BookOpenText,
  ChevronRight,
  CircleAlert,
  ExternalLink,
  FileCheck2,
  Landmark,
  Scale,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { MARKET_LABELS } from "@/lib/markets";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Confidence,
  OfficialLink,
  Panel,
  ReviewNotice,
  StatusBadge,
} from "@/components/shared/ui";
import type { Analysis, Evidence } from "@/types/domain";

function EvidenceDrawer({
  item,
  onClose,
}: {
  item: Evidence | undefined;
  onClose: () => void;
}) {
  return (
    <Sheet open={Boolean(item)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{item?.title}</SheetTitle>
          <SheetDescription>{item?.authority}</SheetDescription>
        </SheetHeader>
        {item && (
          <div className="mt-6 space-y-6">
            <dl className="grid grid-cols-2 gap-4 text-sm">
              {[
                ["Source ID", item.id],
                ["Section", item.section],
                ["Page", item.page ?? "Not specified"],
                ["Jurisdiction", item.jurisdiction],
                ["Version", item.version],
                ["Effective date", item.effectiveDate],
                ["Authority level", item.level],
                ["Verification", item.verified ? "Verified" : "Needs review"],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs font-semibold uppercase text-muted-foreground">
                    {k}
                  </dt>
                  <dd className="mt-1 font-medium">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="rounded-lg border-l-4 border-primary bg-muted p-5">
              <p className="section-label mb-2">Evidence</p>
              <p className="text-sm">{item.provision}</p>
            </div>
            <div className="rounded-lg border-l-4 border-teal bg-accent p-5">
              <p className="section-label mb-2">System interpretation</p>
              <p className="text-sm">{item.relevance}</p>
            </div>
            <OfficialLink url={item.url} />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

export function AnalysisResult({ data }: { data: Analysis }) {
  const [selected, setSelected] = useState<Evidence>();
  return (
    <div className="space-y-8">
      <Panel className="overflow-hidden">
        <div className="border-b border-border bg-primary p-6 text-primary-foreground sm:p-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <StatusBadge status={data.status} />
                <span className="text-sm text-primary-foreground/70">
                  Analysis ID: {data.id}
                </span>
              </div>
              <h1 className="text-3xl font-bold sm:text-4xl">
                {data.product.name}
              </h1>
              <p className="mt-2 max-w-2xl text-primary-foreground/75">
                Evidence-backed product, claim, innovation, IP and compliance
                assessment.
              </p>
            </div>
            <div className="rounded-xl bg-card p-5 text-foreground">
              <p className="section-label">Overall confidence</p>
              <Confidence
                value={data.confidence}
                label={data.confidenceLabel}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Confidence reflects evidence coverage, not legal certainty.
              </p>
            </div>
          </div>
        </div>
        <div className="grid divide-y divide-border md:grid-cols-3 md:divide-x md:divide-y-0">
          <div className="p-5">
            <p className="section-label">Product type</p>
            <p className="mt-1 font-semibold">{data.product.type}</p>
          </div>
          <div className="p-5">
            <p className="section-label">Target market</p>
            <p className="mt-1 font-semibold">
              {MARKET_LABELS[data.product.country]}
            </p>
          </div>
          <div className="p-5">
            <p className="section-label">Assessment date</p>
            <p className="mt-1 font-semibold">{data.date}</p>
          </div>
        </div>
      </Panel>
      {data.failureStates?.length ? (
        <Panel className="border-warning/30 bg-warning-soft p-5">
          <h2 className="font-semibold">Analysis status</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {data.failureStates.map((item) => (
              <li key={item.code}>
                <strong>{item.code}</strong>: {item.message}
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}
      <section>
        <div className="mb-4">
          <p className="section-label">System assessment</p>
          <h2 className="text-2xl font-semibold">
            Multi-dimensional classification
          </h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {data.classifications.map((item) => (
            <Panel key={item.dimension} className="p-6">
              <div className="flex items-start justify-between gap-5">
                <div>
                  <p className="section-label">{item.dimension}</p>
                  <h3 className="mt-2 text-xl font-semibold">{item.value}</h3>
                </div>
                {item.review && (
                  <span className="rounded-full bg-warning-soft px-2.5 py-1 text-xs font-semibold text-warning">
                    Review recommended
                  </span>
                )}
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                {item.rationale}
              </p>
              <div className="mt-5 border-t border-border pt-4">
                <Confidence value={item.confidence} />
                <button
                  className="mt-3 min-h-11 text-sm font-semibold text-primary"
                  onClick={() =>
                    setSelected(
                      data.evidence.find((e) =>
                        item.evidenceIds.includes(e.id),
                      ),
                    )
                  }
                >
                  Review supporting evidence
                </button>
              </div>
            </Panel>
          ))}
        </div>
      </section>
      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="section-label">Why</p>
            <h2 className="text-2xl font-semibold">Supporting evidence</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Evidence excerpts are separated from system interpretation.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/evidence">Browse library</Link>
          </Button>
        </div>
        <div className="space-y-3">
          {data.evidence.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelected(item)}
              className="research-surface flex min-h-24 w-full items-center gap-4 p-5 text-left transition-colors hover:border-primary/30 hover:bg-muted/50"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-info-soft text-info">
                <BookOpenText className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="mb-1 flex flex-wrap items-center gap-2">
                  <strong>{item.title}</strong>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold">
                    {item.level} source
                  </span>
                  {item.verified ? (
                    <span className="rounded-full bg-success-soft px-2 py-0.5 text-xs font-semibold text-success">
                      Verified
                    </span>
                  ) : (
                    <span className="rounded-full bg-warning-soft px-2 py-0.5 text-xs font-semibold text-warning">
                      Needs review
                    </span>
                  )}
                </span>
                <span className="block text-sm text-muted-foreground">
                  {item.authority} · {item.section} · {item.jurisdiction}
                </span>
              </span>
              <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
            </button>
          ))}
        </div>
      </section>
      <section>
        <div className="mb-4">
          <p className="section-label">Potential routes</p>
          <h2 className="text-2xl font-semibold">IP pathways</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {data.pathways.map((path) => (
            <Panel key={path.name} className="p-6">
              <Scale className="mb-5 size-5 text-primary" />
              <p className="section-label">{path.relevance}</p>
              <h3 className="mt-1 text-xl font-semibold">{path.name}</h3>
              <p className="mt-3 text-sm text-muted-foreground">
                {path.reason}
              </p>
              <div className="mt-5 border-t border-border pt-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Next step
                </p>
                <p className="mt-1 text-sm font-medium">{path.nextStep}</p>
              </div>
              <p className="mt-4 text-xs text-warning">{path.confidence}</p>
            </Panel>
          ))}
        </div>
      </section>
      <section>
        <div className="mb-4">
          <p className="section-label">Jurisdiction-specific</p>
          <h2 className="text-2xl font-semibold">Regulatory routes</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {data.compliance.map((route) => (
            <Panel key={route.jurisdiction} className="p-6">
              <div className="flex gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-accent text-teal">
                  <Landmark className="size-5" />
                </span>
                <div>
                  <p className="section-label">{route.jurisdiction}</p>
                  <h3 className="mt-1 text-lg font-semibold">
                    {route.pathway}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Relevant authority: {route.authority}
                  </p>
                </div>
              </div>
              <ol className="mt-5 space-y-3">
                {route.checks.map((check, i) => (
                  <li key={check} className="flex gap-3 text-sm">
                    <span className="font-semibold text-primary">{i + 1}</span>
                    {check}
                  </li>
                ))}
              </ol>
            </Panel>
          ))}
        </div>
      </section>
      <Panel className="flex flex-col justify-between gap-5 p-6 md:flex-row md:items-center">
        <div className="flex gap-4">
          <span className="grid size-11 place-items-center rounded-lg bg-success-soft text-success">
            <FileCheck2 />
          </span>
          <div>
            <h2 className="text-lg font-semibold">Action checklist</h2>
            <p className="text-sm text-muted-foreground">
              {data.checklist.filter((i) => i.status === "complete").length} of{" "}
              {data.checklist.length} actions completed
            </p>
          </div>
        </div>
        <Button asChild>
          <Link
            to="/analysis/$id/checklist"
            params={{ id: data.id }}
            search={{ progress: undefined }}
          >
            Open checklist
            <ChevronRight />
          </Link>
        </Button>
      </Panel>
      <ReviewNotice reason={data.review.reason} action={data.review.action} />
      <EvidenceDrawer item={selected} onClose={() => setSelected(undefined)} />
    </div>
  );
}
