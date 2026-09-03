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
} from "@/components/opsflow/primitives";
import { AiServiceError, summarizeMeeting } from "@/lib/opsflow/ai-service";
import { useOpsFlow } from "@/lib/opsflow/store";
import { NOT_SPECIFIED, type MeetingSummary } from "@/lib/opsflow/types";

export const Route = createFileRoute("/meetings")({
  head: () => ({
    meta: [
      { title: "Meeting Notes Summarizer — OpsFlow AI" },
      {
        name: "description",
        content:
          "Turn raw meeting notes or a transcript into a summary, key points, decisions and action items with owners and deadlines.",
      },
      { property: "og:title", content: "Meeting Notes Summarizer — OpsFlow AI" },
      {
        property: "og:description",
        content:
          "Structured meeting summaries that mark missing owners and deadlines as Not specified.",
      },
    ],
  }),
  component: MeetingsPage,
});

function toClipboardText(s: MeetingSummary) {
  return [
    `SUMMARY\n${s.summary}`,
    `KEY POINTS\n${s.keyPoints.map((p) => `- ${p}`).join("\n")}`,
    `DECISIONS\n${s.decisions.map((d) => `- ${d}`).join("\n")}`,
    `ACTION ITEMS\n${s.actionItems
      .map((a) => `- ${a.description} | Owner: ${a.owner} | Deadline: ${a.deadline}`)
      .join("\n")}`,
  ].join("\n\n");
}

function MeetingsPage() {
  const { meeting, meetingNotes, setMeeting, addActionItems, setEmailSeed } = useOpsFlow();
  const navigate = useNavigate();
  const [notes, setNotes] = useState(meetingNotes);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const result = await summarizeMeeting(notes);
      setMeeting(result, notes);
      toast.success("Summary ready — check owners and deadlines.");
    } catch (e) {
      setMeeting(null, notes);
      setError(e instanceof AiServiceError ? e.message : "Could not summarise these notes.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell breadcrumb="Meetings">
      <section className="mt-8">
        <div className="rise max-w-[46ch]">
          <p className="eyebrow text-primary">(a) — Understand</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
            Meeting Notes Summarizer
          </h1>
          <p className="mt-3 text-[15px] text-pretty text-muted-foreground">
            Decisions, responsibilities and deadlines are only taken from your notes. Anything
            missing is shown as “{NOT_SPECIFIED}”.
          </p>
        </div>
      </section>

      <section className="mt-8">
        <SectionLabel>(b) Meeting Notes · Workspace</SectionLabel>
        <div className="mt-3 grid gap-4 lg:grid-cols-2">
          <Panel>
            <PanelHeader title="Raw notes" kicker="Input" />
            <form
              className="mt-4 space-y-3.5"
              onSubmit={(e) => {
                e.preventDefault();
                void run();
              }}
            >
              <Field
                label="Meeting notes or transcript"
                htmlFor="notes"
                hint="Paste the notes exactly as captured — one point per line works best."
              >
                <TextArea
                  id="notes"
                  rows={16}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={"Attendees: …\nWe agreed to move the launch review to Friday.\nPriya to send the revised budget by 12 June."}
                />
              </Field>
              <div className="flex items-center gap-2">
                <Button type="submit" variant="primary" size="lg" className="flex-1" disabled={loading}>
                  {loading ? "Summarising…" : "Summarize"}
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setNotes("");
                    setMeeting(null, "");
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
                  Suggestion
                </span>
              </div>
              <div className="flex gap-1.5">
                <CopyButton value={meeting ? toClipboardText(meeting) : ""} />
                <Button size="sm" onClick={() => void run()} disabled={loading || !meeting}>
                  Regenerate
                </Button>
              </div>
            </div>

            <div className="mt-4 space-y-5">
              {loading ? (
                <LoadingState label="Reading notes" />
              ) : error ? (
                <ErrorState message={error} />
              ) : !meeting ? (
                <EmptyState
                  title="No summary yet"
                  body="Paste your meeting notes on the left and summarise. Owners and deadlines are only filled in when your notes state them."
                />
              ) : (
                <>
                  <div>
                    <p className="label-mono mb-1.5">Meeting summary</p>
                    <p className="text-[13px] leading-relaxed">{meeting.summary}</p>
                  </div>
                  <div>
                    <p className="label-mono mb-1.5">Key points</p>
                    <OutputList items={meeting.keyPoints} />
                  </div>
                  <div>
                    <p className="label-mono mb-1.5">Decisions</p>
                    <OutputList items={meeting.decisions} />
                  </div>
                  <div>
                    <p className="label-mono mb-2">Action items</p>
                    {meeting.actionItems.length === 0 ? (
                      <p className="text-[13px] text-muted-foreground">{NOT_SPECIFIED}</p>
                    ) : (
                      <ul className="space-y-2">
                        {meeting.actionItems.map((a) => (
                          <li
                            key={a.id}
                            className="rounded-lg border border-border bg-glass-strong p-3"
                          >
                            <p className="text-[13px] font-medium">{a.description}</p>
                            <div className="mt-1.5 flex flex-wrap gap-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                              <span>Owner: {a.owner}</span>
                              <span>Deadline: {a.deadline}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                    <Button
                      variant="ink"
                      size="sm"
                      onClick={() => {
                        const count = addActionItems(meeting.actionItems);
                        toast.success(`${count} action item(s) added to Task Planner`);
                        void navigate({ to: "/planner" });
                      }}
                      disabled={!meeting.actionItems.length}
                    >
                      Add to Task Planner
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        setEmailSeed({
                          purpose: "the follow-up from our meeting",
                          keyInformation: [
                            ...meeting.decisions.filter((d) => d !== NOT_SPECIFIED).map((d) => `Decision: ${d}`),
                            ...meeting.actionItems.map(
                              (a) => `${a.description} — owner ${a.owner}, deadline ${a.deadline}`,
                            ),
                          ].join("\n"),
                          desiredOutcome: "confirm the action items above",
                          note: "Meeting context loaded into Smart Email.",
                        });
                        void navigate({ to: "/email" });
                      }}
                    >
                      Draft Follow-up Email
                    </Button>
                  </div>
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
