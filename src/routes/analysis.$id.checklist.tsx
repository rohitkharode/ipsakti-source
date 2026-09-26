import { createFileRoute } from "@tanstack/react-router";
import { Check, Circle, Clock3, FileText, UserRound } from "lucide-react";
import { useState } from "react";
import { PageHeader, Panel, StatusBadge } from "@/components/shared/ui";
import { analysisService, checklistService } from "@/services";

export const Route = createFileRoute("/analysis/$id/checklist")({
  head: () => ({
    meta: [
      { title: "Action Checklist — IP-SAKTI" },
      {
        name: "description",
        content: "Track evidence-linked IP and compliance actions.",
      },
      { property: "og:title", content: "Action Checklist — IP-SAKTI" },
      {
        property: "og:description",
        content: "Track evidence-linked IP and compliance actions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ChecklistPage,
  loader: ({ params }) => analysisService.get(params.id),
});
function ChecklistPage() {
  const analysis = Route.useLoaderData();
  const { id } = Route.useParams();
  const [items, setItems] = useState(analysis?.checklist ?? []);
  const toggle = (itemId: string) => {
    const current = items.find((i) => i.id === itemId);
    const nextStatus = current?.status === "complete" ? "pending" : "complete";
    setItems((old) =>
      old.map((item) =>
        item.id === itemId ? { ...item, status: nextStatus } : item,
      ),
    );
    void checklistService.update(itemId, nextStatus, id);
  };
  return (
    <>
      <PageHeader
        eyebrow={id}
        title="Action checklist"
        description="Translate the assessment into accountable, evidence-linked next actions."
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <Panel>
          <div className="border-b border-border p-5">
            <h2 className="text-xl font-semibold">Assessment actions</h2>
            <p className="text-sm text-muted-foreground">
              Select an item to update its completion status.
            </p>
          </div>
          <div className="divide-y divide-border">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => toggle(item.id)}
                className="flex min-h-24 w-full gap-4 p-5 text-left hover:bg-muted/50"
              >
                <span
                  className={`mt-1 grid size-7 shrink-0 place-items-center rounded-full border ${item.status === "complete" ? "border-success bg-success text-primary-foreground" : "border-border text-muted-foreground"}`}
                >
                  {item.status === "complete" ? (
                    <Check className="size-4" />
                  ) : (
                    <Circle className="size-3" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <strong>{item.title}</strong>
                    <StatusBadge status={item.status} />
                    <span className="rounded-full bg-muted px-2 py-1 text-xs font-semibold">
                      {item.priority} priority
                    </span>
                  </span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    {item.description}
                  </span>
                  <span className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                    {item.owner && (
                      <span className="inline-flex items-center gap-1">
                        <UserRound className="size-3" />
                        {item.owner}
                      </span>
                    )}
                    {item.dueDate && (
                      <span className="inline-flex items-center gap-1">
                        <Clock3 className="size-3" />
                        Due {item.dueDate}
                      </span>
                    )}
                    {item.evidenceId && (
                      <span className="inline-flex items-center gap-1">
                        <FileText className="size-3" />
                        {item.evidenceId}
                      </span>
                    )}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </Panel>
        <aside className="space-y-4">
          <Panel className="p-5">
            <p className="section-label">Progress</p>
            <p className="mt-2 text-3xl font-bold">
              {items.filter((i) => i.status === "complete").length}/
              {items.length}
            </p>
            <div className="mt-3 h-2 rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-success"
                style={{
                  width: `${items.length ? (items.filter((i) => i.status === "complete").length / items.length) * 100 : 0}%`,
                }}
              />
            </div>
          </Panel>
          <Panel className="p-5">
            <h2 className="font-semibold">Checklist principles</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Completion records workflow progress only. It does not represent
              regulatory approval or legal assurance.
            </p>
          </Panel>
        </aside>
      </div>
    </>
  );
}
