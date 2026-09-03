import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
  Panel,
  PanelHeader,
  SectionLabel,
  SegmentedControl,
  TextArea,
  TextInput,
  ResponsibleAiNotice,
} from "@/components/opsflow/primitives";
import { AiServiceError, generateEmail } from "@/lib/opsflow/ai-service";
import { useOpsFlow } from "@/lib/opsflow/store";
import type { EmailDraft, Tone } from "@/lib/opsflow/types";

export const Route = createFileRoute("/email")({
  head: () => ({
    meta: [
      { title: "Smart Email Generator — OpsFlow AI" },
      {
        name: "description",
        content:
          "Draft workplace emails from recipient, purpose, key information, desired outcome and tone — using only the details you supply.",
      },
      { property: "og:title", content: "Smart Email Generator — OpsFlow AI" },
      {
        property: "og:description",
        content: "Generate clear, on-tone business emails without invented facts or commitments.",
      },
    ],
  }),
  component: EmailPage,
});

const TONES: { value: Tone; label: string }[] = [
  { value: "formal", label: "Formal" },
  { value: "friendly", label: "Friendly" },
  { value: "persuasive", label: "Persuasive" },
];

function EmailPage() {
  const { preferences, emailSeed, setEmailSeed, addTasks } = useOpsFlow();
  const navigate = useNavigate();

  const [recipient, setRecipient] = useState("");
  const [purpose, setPurpose] = useState("");
  const [keyInformation, setKeyInformation] = useState("");
  const [desiredOutcome, setDesiredOutcome] = useState("");
  const [tone, setTone] = useState<Tone>(preferences.defaultTone);
  const [draft, setDraft] = useState<EmailDraft | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!emailSeed) return;
    if (emailSeed.recipient) setRecipient(emailSeed.recipient);
    if (emailSeed.purpose) setPurpose(emailSeed.purpose);
    if (emailSeed.keyInformation) setKeyInformation(emailSeed.keyInformation);
    if (emailSeed.desiredOutcome) setDesiredOutcome(emailSeed.desiredOutcome);
    toast.info(emailSeed.note ?? "Context loaded from another tool.");
    setEmailSeed(null);
  }, [emailSeed, setEmailSeed]);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const result = await generateEmail(
        { recipient, purpose, keyInformation, desiredOutcome, tone },
        preferences,
      );
      setDraft(result);
      toast.success("Draft ready — review before sending.");
    } catch (e) {
      setDraft(null);
      setError(
        e instanceof AiServiceError ? e.message : "Something went wrong generating the draft.",
      );
    } finally {
      setLoading(false);
    }
  }

  function clearAll() {
    setRecipient("");
    setPurpose("");
    setKeyInformation("");
    setDesiredOutcome("");
    setDraft(null);
    setError(null);
  }

  return (
    <AppShell breadcrumb="Smart Email">
      <section className="mt-8">
        <div className="rise max-w-[46ch]">
          <p className="eyebrow text-primary">(a) — Communicate</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
            Smart Email Generator
          </h1>
          <p className="mt-3 text-[15px] text-pretty text-muted-foreground">
            The draft uses only the information you provide. It will not invent facts, promises,
            commitments or deadlines.
          </p>
        </div>
      </section>

      <section className="mt-8">
        <SectionLabel>(b) Smart Email · Workspace</SectionLabel>
        <div className="mt-3 grid gap-4 lg:grid-cols-2">
          <Panel>
            <PanelHeader title="New email" kicker="Input" />
            <form
              className="mt-4 space-y-3.5"
              onSubmit={(e) => {
                e.preventDefault();
                void run();
              }}
            >
              <Field label="Recipient / audience" htmlFor="recipient">
                <TextInput
                  id="recipient"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="Client name or team"
                />
              </Field>
              <Field label="Email purpose" htmlFor="purpose">
                <TextInput
                  id="purpose"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="Follow up on the Q3 onboarding"
                />
              </Field>
              <Field
                label="Key information"
                htmlFor="key-info"
                hint="One fact per line. Only these details appear in the draft."
              >
                <TextArea
                  id="key-info"
                  rows={4}
                  value={keyInformation}
                  onChange={(e) => setKeyInformation(e.target.value)}
                  placeholder="Points the recipient already knows or shared"
                />
              </Field>
              <Field label="Desired outcome" htmlFor="outcome">
                <TextInput
                  id="outcome"
                  value={desiredOutcome}
                  onChange={(e) => setDesiredOutcome(e.target.value)}
                  placeholder="Confirm the next step"
                />
              </Field>
              <Field label="Tone" htmlFor="tone">
                <SegmentedControl
                  ariaLabel="Email tone"
                  value={tone}
                  options={TONES}
                  onChange={setTone}
                />
              </Field>
              <div className="flex items-center gap-2 pt-1">
                <Button type="submit" variant="primary" size="lg" className="flex-1" disabled={loading}>
                  {loading ? "Generating…" : "Generate"}
                </Button>
                <Button type="button" onClick={clearAll} disabled={loading}>
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
                <CopyButton
                  value={draft ? `${draft.subject}\n\n${draft.body}` : ""}
                  label="Copy"
                />
                <Button size="sm" onClick={() => void run()} disabled={loading || !draft}>
                  Regenerate
                </Button>
                <Button size="sm" onClick={() => setDraft(null)} disabled={!draft}>
                  Clear
                </Button>
              </div>
            </div>

            <div className="mt-4">
              {loading ? (
                <LoadingState label="Drafting" />
              ) : error ? (
                <ErrorState message={error} />
              ) : !draft ? (
                <EmptyState
                  title="No draft yet"
                  body="Fill in the purpose and key information, then generate. Nothing is written until you do."
                />
              ) : (
                <>
                  <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                    Subject
                  </p>
                  <TextInput
                    aria-label="Email subject"
                    className="mt-1.5"
                    value={draft.subject}
                    onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
                  />
                  <p className="mt-3.5 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                    Body
                  </p>
                  <TextArea
                    aria-label="Email body"
                    className="mt-1.5 leading-relaxed"
                    rows={12}
                    value={draft.body}
                    onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                  />
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Button
                      variant="ink"
                      size="sm"
                      onClick={() => {
                        addTasks([
                          {
                            id: Math.random().toString(36).slice(2, 10),
                            name: `Send email: ${draft.subject}`,
                            deadline: "",
                            importance: "medium",
                            urgency: "high",
                            durationMinutes: 15,
                          },
                        ]);
                        toast.success("Added to Task Planner");
                        void navigate({ to: "/planner" });
                      }}
                    >
                      Add to Task Planner
                    </Button>
                    <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                      Uses only your inputs · editable
                    </span>
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
