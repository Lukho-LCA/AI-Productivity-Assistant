import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/opsflow/AppShell";
import {
  AiBadge,
  Button,
  CopyButton,
  EmptyState,
  ErrorState,
  Field,
  LoadingState,
  OutputList,
  Panel,
  PanelHeader,
  ResponsibleAiNotice,
  SectionLabel,
  TextArea,
  TextInput,
} from "@/components/opsflow/primitives";
import { AiServiceError, researchBrief } from "@/lib/opsflow/ai-service";
import { newTask, useOpsFlow } from "@/lib/opsflow/store";
import type { ResearchBrief } from "@/lib/opsflow/types";

export const Route = createFileRoute("/research")({
  head: () => ({
    meta: [
      { title: "AI Research Assistant — OpsFlow AI" },
      {
        name: "description",
        content:
          "Summarise a topic or pasted source material into insights, findings, recommendations and a plain-language explanation.",
      },
      { property: "og:title", content: "AI Research Assistant — OpsFlow AI" },
      {
        property: "og:description",
        content: "Structured research briefs with a clear reminder to verify against original sources.",
      },
    ],
  }),
  component: ResearchPage,
});

function ResearchPage() {
  const { addTasks } = useOpsFlow();
  const navigate = useNavigate();
  const [topic, setTopic] = useState("");
  const [source, setSource] = useState("");
  const [brief, setBrief] = useState<ResearchBrief | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const result = await researchBrief({ topic, source });
      setBrief(result);
      toast.success("Brief ready — verify against your sources.");
    } catch (e) {
      setBrief(null);
      setError(e instanceof AiServiceError ? e.message : "Could not build the brief.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell breadcrumb="Research">
      <section className="mt-8">
        <div className="rise max-w-[46ch]">
          <p className="eyebrow text-primary">(a) — Capture</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
            AI Research Assistant
          </h1>
          <p className="mt-3 text-[15px] text-pretty text-muted-foreground">
            Findings are drawn from the source material you paste. Always verify important
            information against the original sources before acting on it.
          </p>
        </div>
      </section>

      <section className="mt-8">
        <SectionLabel>(b) Research · Workspace</SectionLabel>
        <div className="mt-3 grid gap-4 lg:grid-cols-2">
          <Panel>
            <PanelHeader title="Research question" kicker="Input" />
            <form
              className="mt-4 space-y-3.5"
              onSubmit={(e) => {
                e.preventDefault();
                void run();
              }}
            >
              <Field label="Topic / question" htmlFor="topic">
                <TextInput
                  id="topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="How do comparable suppliers price bulk contracts?"
                />
              </Field>
              <Field
                label="Source material (optional)"
                htmlFor="source"
                hint="Paste an article, report extract or notes. Without a source, the brief only structures the question."
              >
                <TextArea
                  id="source"
                  rows={12}
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="Paste the article or notes here…"
                />
              </Field>
              <div className="flex items-center gap-2">
                <Button type="submit" variant="primary" size="lg" className="flex-1" disabled={loading}>
                  {loading ? "Analysing…" : "Analyse"}
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setTopic("");
                    setSource("");
                    setBrief(null);
                    setError(null);
                  }}
                  disabled={loading}
                >
                  Clear
                </Button>
              </div>
            </form>
          </Panel>

          <Panel className="border-primary/25 bg-glass">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AiBadge />
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                  Verify at source
                </span>
              </div>
              <div className="flex gap-1.5">
                <CopyButton
                  value={
                    brief
                      ? [
                          brief.summary,
                          brief.keyInsights.join("\n"),
                          brief.findings.join("\n"),
                          brief.recommendations.join("\n"),
                          brief.simplified,
                        ].join("\n\n")
                      : ""
                  }
                />
                <Button size="sm" onClick={() => void run()} disabled={loading || !brief}>
                  Regenerate
                </Button>
              </div>
            </div>

            <div className="mt-4 space-y-5">
              {loading ? (
                <LoadingState label="Reading source" />
              ) : error ? (
                <ErrorState message={error} />
              ) : !brief ? (
                <EmptyState
                  title="No brief yet"
                  body="Enter your question — and paste source material for grounded findings rather than an empty structure."
                />
              ) : (
                <>
                  <div>
                    <p className="label-mono mb-1.5">Summary</p>
                    <p className="text-[13px] leading-relaxed">{brief.summary}</p>
                  </div>
                  <div>
                    <p className="label-mono mb-1.5">Key insights</p>
                    <OutputList items={brief.keyInsights} />
                  </div>
                  <div>
                    <p className="label-mono mb-1.5">Findings</p>
                    <OutputList items={brief.findings} />
                  </div>
                  <div>
                    <p className="label-mono mb-2">Recommendations</p>
                    <ul className="space-y-2">
                      {brief.recommendations.map((r, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 rounded-lg border border-border bg-glass-strong p-3"
                        >
                          <span className="flex-1 text-[13px]">{r}</span>
                          <Button
                            size="sm"
                            onClick={() => {
                              addTasks([newTask({ name: r, importance: "medium", urgency: "medium" })]);
                              toast.success("Added to Task Planner");
                            }}
                          >
                            Add to Task Planner
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="label-mono mb-1.5">Simplified explanation</p>
                    <p className="text-[13px] leading-relaxed">{brief.simplified}</p>
                  </div>
                  <Button size="sm" onClick={() => void navigate({ to: "/planner" })}>
                    Open Task Planner
                  </Button>
                </>
              )}
            </div>
          </Panel>
        </div>
      </section>

      <ResponsibleAiNotice className="mt-6" />
    </AppShell>
  );
}
