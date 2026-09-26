import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, CircleHelp, FileSearch, Scale } from "lucide-react";
import { PageHeader, Panel } from "@/components/shared/ui";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help — IP-SAKTI" },
      {
        name: "description",
        content: "Guidance for evidence-backed IP-SAKTI assessments.",
      },
      { property: "og:title", content: "Help — IP-SAKTI" },
      {
        property: "og:description",
        content: "Guidance for evidence-backed assessments.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HelpPage,
});
function HelpPage() {
  const topics = [
    {
      icon: BookOpen,
      title: "Start an assessment",
      text: "Provide complete product, ingredient, claim, preparation, innovation, and market information.",
      to: "/analysis/new" as const,
    },
    {
      icon: FileSearch,
      title: "Read the evidence",
      text: "Keep source text separate from IP-SAKTI's interpretation and check authority and version.",
      to: "/evidence" as const,
    },
    {
      icon: Scale,
      title: "Use pathway guidance",
      text: "Pathways are research guidance, not legal guarantees, approvals, or final professional advice.",
      to: "/cases" as const,
    },
  ];
  return (
    <>
      <PageHeader
        eyebrow="Support"
        title="Help and guidance"
        description="Understand the assessment workflow, evidence records, and responsible use of pathway guidance."
      />
      <div className="grid gap-5 lg:grid-cols-3">
        {topics.map(({ icon: Icon, ...topic }) => (
          <Panel key={topic.title} className="p-6">
            <Icon className="size-6 text-primary" />
            <h2 className="mt-5 text-xl font-semibold">{topic.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{topic.text}</p>
            <Link
              to={topic.to}
              className="mt-5 inline-flex min-h-11 items-center font-semibold text-primary"
            >
              Open section
            </Link>
          </Panel>
        ))}
      </div>
      <Panel className="mt-6 p-6">
        <div className="flex gap-4">
          <CircleHelp className="size-6 shrink-0 text-warning" />
          <div>
            <h2 className="text-lg font-semibold">Important limitation</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              IP-SAKTI organizes evidence and suggests potentially relevant
              pathways. It does not provide legal advice, guarantee
              patentability, or represent regulatory approval. Escalate
              uncertain findings to an appropriate expert.
            </p>
          </div>
        </div>
      </Panel>
    </>
  );
}
