import { createFileRoute } from "@tanstack/react-router";
import { AnalysisResult } from "@/components/features/analysis-result";
import { EmptyState, PageHeader } from "@/components/shared/ui";
import { analysisService } from "@/services";

export const Route = createFileRoute("/analysis/$id/")({
  validateSearch: (search: Record<string, unknown>) => ({
    progress: search["progress"] === "true" ? "true" : undefined,
  }),
  loader: ({ params }) => analysisService.get(params.id),
  head: ({ params }) => ({
    meta: [
      { title: `${params.id} — IP-SAKTI Analysis` },
      {
        name: "description",
        content:
          "Evidence-backed classification, IP pathways, compliance routes, and next actions.",
      },
      { property: "og:title", content: `${params.id} — IP-SAKTI Analysis` },
      {
        property: "og:description",
        content: "Evidence-backed product analysis and next actions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AnalysisPage,
});

function AnalysisPage() {
  const data = Route.useLoaderData();
  const { id } = Route.useParams();
  if (!data)
    return (
      <>
        <PageHeader
          eyebrow={id}
          title="Analysis not found"
          description="This analysis reference does not exist in the case record."
        />
        <EmptyState
          title="Nothing to display"
          description="Start a new analysis or open an existing case from the Cases page."
        />
      </>
    );
  return <AnalysisResult data={data} />;
}
