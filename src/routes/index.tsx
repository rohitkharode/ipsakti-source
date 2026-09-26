import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BriefcaseBusiness,
  Database,
  FileCheck2,
  FileSearch,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Confidence,
  PageHeader,
  Panel,
  StatusBadge,
} from "@/components/shared/ui";
import { analysisService, caseService } from "@/services";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Overview — IP-SAKTI" },
      {
        name: "description",
        content:
          "Start and review evidence-backed Ayurveda product assessments.",
      },
      { property: "og:title", content: "Overview — IP-SAKTI" },
      {
        property: "og:description",
        content:
          "Start and review evidence-backed Ayurveda product assessments.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: async () => {
    try {
      return {
        cases: await caseService.list(),
        stats: await analysisService.stats(),
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes("Unauthorized")) {
        return {
          cases: [],
          stats: {
            activeAnalyses: 0,
            evidenceSources: 0,
            pendingReviews: 0,
            completedAnalyses: 0,
          },
        };
      }
      throw error;
    }
  },
  component: Overview,
});

function Overview() {
  const { cases, stats } = Route.useLoaderData();
  const metrics = [
    {
      label: "Active analyses",
      value: String(stats.activeAnalyses),
      icon: BriefcaseBusiness,
    },
    {
      label: "Evidence sources",
      value: String(stats.evidenceSources),
      icon: Database,
    },
    {
      label: "Pending reviews",
      value: String(stats.pendingReviews),
      icon: FileSearch,
    },
    {
      label: "Completed analyses",
      value: String(stats.completedAnalyses),
      icon: FileCheck2,
    },
  ];
  return (
    <>
      <PageHeader
        eyebrow="Research workspace"
        title="Evidence-backed assessment starts here"
        description="Classify an Ayurveda product, review the supporting evidence, and identify responsible IP and compliance next steps."
        actions={
          <Button size="lg" asChild>
            <Link to="/analysis/new">
              <Plus />
              Start New Analysis
            </Link>
          </Button>
        }
      />
      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ icon: Icon, ...item }) => (
          <Panel key={item.label} className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="mt-2 text-3xl font-bold">{item.value}</p>
              </div>
              <span className="grid size-10 place-items-center rounded-lg bg-muted text-primary">
                <Icon className="size-5" />
              </span>
            </div>
          </Panel>
        ))}
      </div>
      <Panel>
        <div className="flex flex-col justify-between gap-4 border-b border-border p-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-semibold">Recent analyses</h2>
            <p className="text-sm text-muted-foreground">
              Continue work or inspect the latest assessment evidence.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/cases">View Cases</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/evidence">Browse Evidence</Link>
            </Button>
          </div>
        </div>
        <div className="divide-y divide-border">
          {cases.length === 0 && (
            <p className="p-5 text-sm text-muted-foreground">
              No analyses yet. Start a new analysis to build the first
              evidence-backed case.
            </p>
          )}
          {cases.map((item) => (
            <Link
              key={item.id}
              to="/analysis/$id"
              params={{ id: item.analysisId }}
              search={{ progress: undefined }}
              className="grid gap-3 p-5 transition-colors hover:bg-muted/60 md:grid-cols-[1.5fr_1fr_160px_120px_110px] md:items-center"
            >
              <div>
                <strong className="block">{item.product}</strong>
                <span className="text-xs text-muted-foreground">{item.id}</span>
              </div>
              <span className="text-sm">{item.classification}</span>
              <Confidence value={item.confidence} />
              <StatusBadge status={item.status} />
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                Open <ArrowRight className="size-4" />
              </span>
            </Link>
          ))}
        </div>
      </Panel>
    </>
  );
}
