import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/opsflow/AppShell";
import {
  AiBadge,
  Button,
  CopyButton,
  EmptyState,
  ErrorState,
  LoadingState,
  Panel,
  PanelHeader,
  ResponsibleAiNotice,
  SectionLabel,
  TextArea,
} from "@/components/opsflow/primitives";
import { AiServiceError, assistantReply } from "@/lib/opsflow/ai-service";
import { useOpsFlow } from "@/lib/opsflow/store";
import type { ChatMessage } from "@/lib/opsflow/types";

export const Route = createFileRoute("/assistant")({
  head: () => ({
    meta: [
      { title: "AI Workplace Assistant — OpsFlow AI" },
      {
        name: "description",
        content:
          "Ask practical questions about workplace productivity, planning, communication and business administration.",
      },
      { property: "og:title", content: "AI Workplace Assistant — OpsFlow AI" },
      {
        property: "og:description",
        content: "A focused chat assistant for planning, communication and admin work.",
      },
    ],
  }),
  component: AssistantPage,
});

const EXAMPLES = [
  "How should I prioritise a week with three competing deadlines?",
  "What belongs in a follow-up email after a client meeting?",
  "How do I keep meeting minutes that people actually act on?",
  "How can I tidy up a messy approvals process?",
];

const uid = () => Math.random().toString(36).slice(2, 10);

function AssistantPage() {
  const { preferences } = useOpsFlow();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || loading) return;
    setInput("");
    setError(null);
    setMessages((m) => [...m, { id: uid(), role: "user", content, createdAt: Date.now() }]);
    setLoading(true);
    try {
      const reply = await assistantReply(content, preferences);
      setMessages((m) => [
        ...m,
        { id: uid(), role: "assistant", content: reply, createdAt: Date.now() },
      ]);
    } catch (e) {
      setError(e instanceof AiServiceError ? e.message : "The assistant could not reply.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell breadcrumb="AI Assistant">
      <section className="mt-8">
        <div className="rise max-w-[46ch]">
          <p className="eyebrow text-primary">(a) — Act</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
            AI Workplace Assistant
          </h1>
          <p className="mt-3 text-[15px] text-pretty text-muted-foreground">
            Focused on workplace productivity, planning, communication and business
            administration.
          </p>
        </div>
      </section>

      <section className="mt-8">
        <SectionLabel>(b) Assistant · Workspace</SectionLabel>
        <div className="mt-3 grid gap-4 lg:grid-cols-[1fr_18rem]">
          <Panel className="flex min-h-[28rem] flex-col">
            <PanelHeader
              title="Conversation"
              actions={
                <Button
                  size="sm"
                  onClick={() => {
                    setMessages([]);
                    setError(null);
                  }}
                  disabled={!messages.length}
                >
                  Clear chat
                </Button>
              }
            />

            <div className="mt-4 flex-1 space-y-4 overflow-y-auto pr-1">
              {messages.length === 0 && !loading ? (
                <EmptyState
                  title="Ask your first question"
                  body="Try one of the example prompts, or describe the workplace problem you're working through."
                />
              ) : null}

              {messages.map((m) =>
                m.role === "user" ? (
                  <div key={m.id} className="flex justify-end">
                    <p className="max-w-[80%] rounded-2xl rounded-br-md bg-primary px-3.5 py-2.5 text-[13px] leading-relaxed text-primary-foreground">
                      {m.content}
                    </p>
                  </div>
                ) : (
                  <div key={m.id} className="max-w-[92%] space-y-2">
                    <AiBadge />
                    <div className="space-y-1.5 text-[13px] leading-relaxed">
                      {m.content.split("\n").map((line, i) => (
                        <p key={i}>{line.replace(/\*\*/g, "")}</p>
                      ))}
                    </div>
                    <CopyButton value={m.content} />
                  </div>
                ),
              )}

              {loading ? <LoadingState label="Thinking" /> : null}
              {error ? <ErrorState message={error} /> : null}
              <div ref={endRef} />
            </div>

            <form
              className="mt-4 flex items-end gap-2 border-t border-border pt-4"
              onSubmit={(e) => {
                e.preventDefault();
                void send(input);
              }}
            >
              <label htmlFor="chat-input" className="sr-only">
                Message the assistant
              </label>
              <TextArea
                id="chat-input"
                rows={2}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send(input);
                  }
                }}
                placeholder="Ask about planning, communication or admin…"
              />
              <Button type="submit" variant="primary" size="lg" disabled={loading || !input.trim()}>
                Send
              </Button>
            </form>
          </Panel>

          <Panel>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
              Example prompts
            </p>
            <div className="mt-3 space-y-2">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => void send(ex)}
                  disabled={loading}
                  className="w-full rounded-lg border border-border bg-glass-strong p-3 text-left text-[13px] leading-relaxed transition-colors hover:border-primary/40 disabled:opacity-50"
                >
                  {ex}
                </button>
              ))}
            </div>
          </Panel>
        </div>
      </section>

      <ResponsibleAiNotice className="mt-6" />
    </AppShell>
  );
}
