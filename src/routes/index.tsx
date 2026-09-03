import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/opsflow/AppShell";
import {
  Button,
  Panel,
  ResponsibleAiNotice,
  SectionLabel,
} from "@/components/opsflow/primitives";
import { useOpsFlow } from "@/lib/opsflow/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OpsFlow AI — Turn everyday business work into organised action" },
      {
        name: "description",
        content:
          "OpsFlow AI is one workspace for email drafting, meeting summaries, task planning, research and a workplace assistant.",
      },
      { property: "og:title", content: "OpsFlow AI — Workplace productivity assistant" },
      {
        property: "og:description",
        content:
          "Capture, understand, plan, communicate and act — five AI tools in one integrated dashboard.",
      },
    ],
  }),
  component: Dashboard,
});

const TOOLS = [
  {
    no: "01",
    to: "/email",
    title: "Smart Email",
    body: "Draft from intent, never invented facts.",
  },
  {
    no: "02",
    to: "/meetings",
    title: "Meeting Notes",
    body: "Transcript to decisions & owners.",
  },
  {
    no: "03",
    to: "/planner",
    title: "Task Planner",
    body: "Prioritised, non-overlapping schedule.",
  },
  {
    no: "04",
    to: "/research",
    title: "Research",
    body: "Insights with verify-first guidance.",
  },
  {
    no: "05",
    to: "/assistant",
    title: "AI Assistant",
    body: "Practical answers on planning and admin.",
  },
] as const;

const PIPELINE = ["Meeting", "Action Items", "Tasks", "Communication"] as const;

function Dashboard() {
  const { tasks, meeting } = useOpsFlow();
  const dueToday = tasks.filter(
    (t) => t.deadline && t.deadline === new Date().toISOString().slice(0, 10),
  ).length;

  return (
    <AppShell breadcrumb="Dashboard">
      <section className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="rise max-w-[34ch]">
            <p className="eyebrow text-primary">(a) — OpsFlow AI</p>
            <h1 className="mt-3 text-4xl font-extrabold leading-[1.02] tracking-tight text-balance sm:text-5xl">
              Good morning 👋<span className="text-primary">.</span>
            </h1>
            <p className="mt-3 text-[15px] text-pretty text-muted-foreground">
              Turn everyday business work into organised action — capture, plan and communicate
              in one workspace.
            </p>
          </div>
          <div className="text-right font-mono text-[11px] leading-relaxed text-muted-foreground">
            <p>{new Date().toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}</p>
            <p className="font-medium text-foreground">
              {tasks.length} task{tasks.length === 1 ? "" : "s"} in planner · {dueToday} due today
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-glass p-3 backdrop-blur-md">
          <span className="px-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
            Workflow
          </span>
          {PIPELINE.map((step, i) => (
            <span key={step} className="flex items-center gap-2">
              <span
                className={
                  i === 0
                    ? "rounded-md bg-foreground px-2.5 py-1.5 text-xs font-medium text-background"
                    : i === 2
                      ? "rounded-md border border-primary/20 bg-primary/10 px-2.5 py-1.5 text-xs font-medium text-primary"
                      : "rounded-md border border-border px-2.5 py-1.5 text-xs font-medium"
                }
              >
                {step}
              </span>
              {i < PIPELINE.length - 1 ? (
                <span className="font-mono text-xs text-muted-foreground">→</span>
              ) : null}
            </span>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <SectionLabel
          action={
            <Link to="/assistant" className="text-xs font-medium text-primary hover:underline">
              Open all
            </Link>
          }
        >
          (b) Tools
        </SectionLabel>
        <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-5">
          {TOOLS.map((tool, i) => (
            <Link
              key={tool.to}
              to={tool.to}
              className="rise group rounded-xl border border-border bg-glass p-4 ring-1 ring-foreground/5 backdrop-blur-md transition-colors hover:border-primary/40"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <p className="font-mono text-[10px] text-muted-foreground">{tool.no}</p>
              <p className="mt-6 text-[15px] font-semibold tracking-tight">{tool.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{tool.body}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <SectionLabel>(c) Quick actions</SectionLabel>
        <div className="mt-3 grid gap-4 lg:grid-cols-3">
          <Panel className="lg:col-span-2">
            <p className="text-sm font-semibold tracking-tight">Start where you are</p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Every tool feeds the next: a meeting becomes action items, action items become
              scheduled tasks, and tasks become the follow-up email.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to="/meetings">
                <Button variant="primary" size="lg">
                  Summarise a meeting
                </Button>
              </Link>
              <Link to="/email">
                <Button>Draft an email</Button>
              </Link>
              <Link to="/planner">
                <Button>Plan my day</Button>
              </Link>
              <Link to="/research">
                <Button>Research a topic</Button>
              </Link>
            </div>
          </Panel>
          <Panel>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
              Workspace state
            </p>
            <dl className="mt-3 space-y-2 text-[13px]">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Tasks in planner</dt>
                <dd className="font-medium">{tasks.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Last meeting summary</dt>
                <dd className="font-medium">{meeting ? "Ready" : "None yet"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Action items captured</dt>
                <dd className="font-medium">{meeting?.actionItems.length ?? 0}</dd>
              </div>
            </dl>
          </Panel>
        </div>
      </section>

      <ResponsibleAiNotice className="mt-6" />
    </AppShell>
  );
}
