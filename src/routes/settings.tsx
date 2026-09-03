import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell } from "@/components/opsflow/AppShell";
import {
  Button,
  Field,
  Panel,
  PanelHeader,
  ResponsibleAiNotice,
  SectionLabel,
  SegmentedControl,
  SelectInput,
} from "@/components/opsflow/primitives";
import { useOpsFlow } from "@/lib/opsflow/store";
import type { ResponseLength, Tone } from "@/lib/opsflow/types";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — OpsFlow AI" },
      {
        name: "description",
        content:
          "Set your default email tone, AI response preferences, and read how OpsFlow AI handles generated content.",
      },
      { property: "og:title", content: "Settings — OpsFlow AI" },
      {
        property: "og:description",
        content: "Default tone, response preferences and Responsible AI information.",
      },
    ],
  }),
  component: SettingsPage,
});

const TONES: { value: Tone; label: string }[] = [
  { value: "formal", label: "Formal" },
  { value: "friendly", label: "Friendly" },
  { value: "persuasive", label: "Persuasive" },
];

function SettingsPage() {
  const { preferences, updatePreferences, replaceTasks, setMeeting } = useOpsFlow();

  return (
    <AppShell breadcrumb="Settings">
      <section className="mt-8">
        <div className="rise max-w-[46ch]">
          <p className="eyebrow text-primary">(a) — Preferences</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
            Settings
          </h1>
          <p className="mt-3 text-[15px] text-pretty text-muted-foreground">
            These preferences apply across every OpsFlow tool. They are stored on this device
            only.
          </p>
        </div>
      </section>

      <section className="mt-8">
        <SectionLabel>(b) Workspace preferences</SectionLabel>
        <div className="mt-3 grid gap-4 lg:grid-cols-2">
          <Panel>
            <PanelHeader title="AI preferences" kicker="Defaults" />
            <div className="mt-4 space-y-4">
              <Field label="Default email tone" htmlFor="default-tone">
                <SegmentedControl
                  ariaLabel="Default email tone"
                  value={preferences.defaultTone}
                  options={TONES}
                  onChange={(defaultTone) => updatePreferences({ defaultTone })}
                />
              </Field>
              <Field label="Response length" htmlFor="length">
                <SelectInput
                  id="length"
                  value={preferences.responseLength}
                  onChange={(e) =>
                    updatePreferences({ responseLength: e.target.value as ResponseLength })
                  }
                >
                  <option value="concise">Concise</option>
                  <option value="balanced">Balanced</option>
                  <option value="detailed">Detailed</option>
                </SelectInput>
              </Field>
              <label className="flex items-start gap-3 text-[13px]">
                <input
                  type="checkbox"
                  className="mt-0.5 size-4 accent-[var(--primary)]"
                  checked={preferences.includeAssumptions}
                  onChange={(e) => updatePreferences({ includeAssumptions: e.target.checked })}
                />
                <span>
                  Always show assumptions and gaps
                  <span className="block text-muted-foreground">
                    Missing owners, deadlines or facts are labelled “Not specified” instead of
                    being filled in.
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-3 text-[13px]">
                <input
                  type="checkbox"
                  className="mt-0.5 size-4 accent-[var(--primary)]"
                  checked={preferences.labelAiOutput}
                  onChange={(e) => updatePreferences({ labelAiOutput: e.target.checked })}
                />
                <span>
                  Label AI-generated content
                  <span className="block text-muted-foreground">
                    Keeps the “AI-generated” marker on every output panel.
                  </span>
                </span>
              </label>
              <div className="border-t border-border pt-4">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    replaceTasks([]);
                    setMeeting(null, "");
                    toast.success("Workspace data cleared on this device");
                  }}
                >
                  Clear workspace data
                </Button>
              </div>
            </div>
          </Panel>

          <div className="space-y-4">
            <Panel>
              <PanelHeader title="About OpsFlow AI" kicker="v1.0" />
              <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
                OpsFlow AI turns everyday business work into organised action. It brings email
                drafting, meeting summaries, task planning, research and a workplace assistant
                into one dashboard so a single piece of work moves through capture, understand,
                plan, communicate and act without changing tools.
              </p>
              <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
                AI behaviour lives in a dedicated service layer, separate from the interface. No
                model API key is configured, so outputs come from a built-in demo service that
                derives everything from your own input — no keys are exposed in the browser.
              </p>
            </Panel>
            <Panel>
              <PanelHeader title="Responsible AI" kicker="Policy" />
              <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-muted-foreground">
                <li>• Generated content is always labelled as AI-generated.</li>
                <li>• Outputs use only the information you supply.</li>
                <li>• Facts, promises, commitments and deadlines are never invented.</li>
                <li>• Missing information is shown as “Not specified”.</li>
                <li>• Every output is editable before you use it.</li>
              </ul>
            </Panel>
          </div>
        </div>
      </section>

      <ResponsibleAiNotice className="mt-6" />
    </AppShell>
  );
}
