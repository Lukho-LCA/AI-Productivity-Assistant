import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Trash2 } from "lucide-react";
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
  SelectInput,
  TextInput,
} from "@/components/opsflow/primitives";
import { AiServiceError, planTasks } from "@/lib/opsflow/ai-service";
import { newTask, useOpsFlow } from "@/lib/opsflow/store";
import type { Level, TaskPlan } from "@/lib/opsflow/types";

export const Route = createFileRoute("/planner")({
  head: () => ({
    meta: [
      { title: "AI Task Planner — OpsFlow AI" },
      {
        name: "description",
        content:
          "Enter tasks with deadlines, importance, urgency and duration to get a prioritised, non-overlapping schedule with stated assumptions.",
      },
      { property: "og:title", content: "AI Task Planner — OpsFlow AI" },
      {
        property: "og:description",
        content: "Prioritise urgent and important work into a realistic daily schedule.",
      },
    ],
  }),
  component: PlannerPage,
});

const LEVELS: Level[] = ["low", "medium", "high"];

function PlannerPage() {
  const { tasks, replaceTasks, addTasks, setEmailSeed } = useOpsFlow();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<TaskPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (id: string, patch: Partial<(typeof tasks)[number]>) =>
    replaceTasks(tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const result = await planTasks(tasks);
      setPlan(result);
      toast.success("Plan generated");
    } catch (e) {
      setPlan(null);
      setError(e instanceof AiServiceError ? e.message : "Could not build a plan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell breadcrumb="Task Planner">
      <section className="mt-8">
        <div className="rise max-w-[46ch]">
          <p className="eyebrow text-primary">(a) — Plan</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
            AI Task Planner
          </h1>
          <p className="mt-3 text-[15px] text-pretty text-muted-foreground">
            Urgent and important work goes first. Deadlines are never invented — where information
            is missing, the assumption is stated.
          </p>
        </div>
      </section>

      <section className="mt-8">
        <SectionLabel>(b) Task Planner · Workspace</SectionLabel>
        <div className="mt-3 grid gap-4 lg:grid-cols-2">
          <Panel>
            <PanelHeader
              title="Your tasks"
              kicker="Input"
              actions={
                <Button size="sm" onClick={() => addTasks([newTask()])}>
                  Add task
                </Button>
              }
            />
            <div className="mt-4 space-y-3">
              {tasks.length === 0 ? (
                <EmptyState
                  title="No tasks yet"
                  body="Add a task, or send action items over from a meeting summary."
                />
              ) : (
                tasks.map((t, i) => (
                  <div
                    key={t.id}
                    className="rounded-xl border border-border bg-glass-strong p-3.5"
                  >
                    <div className="flex items-start gap-2">
                      <span className="mt-2 font-mono text-[10px] text-muted-foreground">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0 flex-1 space-y-2.5">
                        <Field label="Task name" htmlFor={`name-${t.id}`}>
                          <TextInput
                            id={`name-${t.id}`}
                            value={t.name}
                            onChange={(e) => update(t.id, { name: e.target.value })}
                            placeholder="Prepare the client onboarding pack"
                          />
                        </Field>
                        <div className="grid grid-cols-2 gap-2.5">
                          <Field label="Deadline" htmlFor={`deadline-${t.id}`}>
                            <TextInput
                              id={`deadline-${t.id}`}
                              type="date"
                              value={t.deadline}
                              onChange={(e) => update(t.id, { deadline: e.target.value })}
                            />
                          </Field>
                          <Field label="Duration (minutes)" htmlFor={`duration-${t.id}`}>
                            <TextInput
                              id={`duration-${t.id}`}
                              type="number"
                              min={5}
                              step={5}
                              value={t.durationMinutes}
                              onChange={(e) =>
                                update(t.id, { durationMinutes: Number(e.target.value) || 0 })
                              }
                            />
                          </Field>
                          <Field label="Importance" htmlFor={`importance-${t.id}`}>
                            <SelectInput
                              id={`importance-${t.id}`}
                              value={t.importance}
                              onChange={(e) => update(t.id, { importance: e.target.value as Level })}
                            >
                              {LEVELS.map((l) => (
                                <option key={l} value={l}>
                                  {l}
                                </option>
                              ))}
                            </SelectInput>
                          </Field>
                          <Field label="Urgency" htmlFor={`urgency-${t.id}`}>
                            <SelectInput
                              id={`urgency-${t.id}`}
                              value={t.urgency}
                              onChange={(e) => update(t.id, { urgency: e.target.value as Level })}
                            >
                              {LEVELS.map((l) => (
                                <option key={l} value={l}>
                                  {l}
                                </option>
                              ))}
                            </SelectInput>
                          </Field>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label={`Remove task ${i + 1}`}
                        onClick={() => replaceTasks(tasks.filter((x) => x.id !== t.id))}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Button
                variant="primary"
                size="lg"
                className="flex-1"
                onClick={() => void run()}
                disabled={loading || tasks.length === 0}
              >
                {loading ? "Planning…" : "Generate plan"}
              </Button>
              <Button
                onClick={() => {
                  replaceTasks([]);
                  setPlan(null);
                  setError(null);
                }}
                disabled={loading || tasks.length === 0}
              >
                Clear
              </Button>
            </div>
          </Panel>

          <Panel className="border-primary/25 bg-glass">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AiBadge />
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                  Prioritised schedule
                </span>
              </div>
              <div className="flex gap-1.5">
                <CopyButton
                  value={
                    plan
                      ? plan.scheduled
                          .map(
                            (t) =>
                              `${t.order}. ${t.start}–${t.end} ${t.name} [${t.bucket}] deadline: ${t.deadline || "Not specified"}`,
                          )
                          .join("\n")
                      : ""
                  }
                />
                <Button size="sm" onClick={() => void run()} disabled={loading || !plan}>
                  Regenerate
                </Button>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              {loading ? (
                <LoadingState label="Sequencing" />
              ) : error ? (
                <ErrorState message={error} />
              ) : !plan ? (
                <EmptyState
                  title="No plan yet"
                  body="Add your tasks and generate. Blocks are laid out back-to-back from 09:00 so nothing overlaps."
                />
              ) : (
                <>
                  <ul className="space-y-2">
                    {plan.scheduled.map((t) => (
                      <li
                        key={t.id}
                        className="flex items-start gap-3 rounded-lg border border-border bg-glass-strong p-3"
                      >
                        <span className="grid size-6 shrink-0 place-items-center rounded-md bg-foreground font-mono text-[10px] text-background">
                          {t.order}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-medium">{t.name}</p>
                          <div className="mt-1 flex flex-wrap gap-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                            <span>
                              {t.start}–{t.end}
                            </span>
                            <span>{t.durationMinutes} min</span>
                            <span>Deadline: {t.deadline || "Not specified"}</span>
                          </div>
                        </div>
                        <span className="shrink-0 rounded-md border border-primary/20 bg-primary/10 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-primary">
                          {t.bucket}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="border-t border-border pt-4">
                    <p className="label-mono mb-1.5">Assumptions</p>
                    <OutputList items={plan.assumptions} />
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      setEmailSeed({
                        purpose: "this week's priorities",
                        keyInformation: plan.scheduled
                          .map(
                            (t) =>
                              `${t.name} — ${t.start}–${t.end}${t.deadline ? `, deadline ${t.deadline}` : ""}`,
                          )
                          .join("\n"),
                        desiredOutcome: "confirm these priorities work for you",
                        note: "Plan loaded into Smart Email.",
                      });
                      void navigate({ to: "/email" });
                    }}
                  >
                    Draft Follow-up Email
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
