/**
 * OpsFlow AI service layer.
 *
 * All AI behaviour lives here so UI components never contain generation logic.
 * No API key is configured, so this is a deterministic demo/mock service: it
 * derives every output ONLY from user-supplied input and writes "Not specified"
 * where information is missing. Swapping in a real model later means replacing
 * the function bodies below (calling a server function), not the UI.
 */
import {
  NOT_SPECIFIED,
  type ActionItem,
  type EmailDraft,
  type EmailInput,
  type MeetingSummary,
  type Preferences,
  type ResearchBrief,
  type ResearchInput,
  type Level,
  type ScheduledTask,
  type TaskInput,
  type TaskPlan,
  type Tone,
} from "./types";

export class AiServiceError extends Error {}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const uid = () => Math.random().toString(36).slice(2, 10);

const clean = (value: string) => value.trim().replace(/\s+/g, " ");

const lines = (value: string) =>
  value
    .split(/\r?\n|(?<=\.)\s+(?=[A-Z])/)
    .map((l) => l.trim())
    .filter(Boolean);

const orNotSpecified = (value: string) => (clean(value) ? clean(value) : NOT_SPECIFIED);

const sentenceCase = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1).replace(/\.$/, "");

/* ---------------------------------- email --------------------------------- */

const greetings: Record<Tone, (to: string) => string> = {
  formal: (to) => `Dear ${to},`,
  friendly: (to) => `Hi ${to},`,
  persuasive: (to) => `Hello ${to},`,
};

const signOffs: Record<Tone, string> = {
  formal: "Kind regards",
  friendly: "Thanks so much",
  persuasive: "Looking forward to your response",
};

const openers: Record<Tone, (purpose: string) => string> = {
  formal: (p) => `I am writing regarding ${p}.`,
  friendly: (p) => `I wanted to reach out about ${p}.`,
  persuasive: (p) => `I'd like to share why ${p} matters right now.`,
};

export async function generateEmail(
  input: EmailInput,
  prefs?: Partial<Preferences>,
): Promise<EmailDraft> {
  await delay(700);
  if (!clean(input.purpose) && !clean(input.keyInformation)) {
    throw new AiServiceError(
      "Add at least an email purpose or some key information — the draft only uses details you provide.",
    );
  }

  const recipient = clean(input.recipient) || "team";
  const purpose = clean(input.purpose) || "the item below";
  const details = lines(input.keyInformation);
  const outcome = clean(input.desiredOutcome);
  const tone = input.tone;

  const subjectCore = sentenceCase(purpose);
  const subject =
    tone === "persuasive" ? `${subjectCore} — a quick decision needed` : subjectCore;

  const paragraphs: string[] = [greetings[tone](recipient), openers[tone](purpose)];

  if (details.length === 1) {
    paragraphs.push(details[0] as string);
  } else if (details.length > 1) {
    paragraphs.push(details.map((d) => `• ${d.replace(/^[-•]\s*/, "")}`).join("\n"));
  }

  if (outcome) {
    paragraphs.push(
      tone === "persuasive"
        ? `If you agree, the next step is simple: ${outcome.toLowerCase()}.`
        : `Could you please ${outcome.replace(/^please\s+/i, "").toLowerCase()}?`,
    );
  }

  if (prefs?.responseLength !== "concise") {
    paragraphs.push(
      "If anything above needs clarifying, reply to this message and I'll follow up.",
    );
  }

  paragraphs.push(`${signOffs[tone]},`);

  return { subject, body: paragraphs.join("\n\n") };
}

/* --------------------------------- meetings -------------------------------- */

const OWNER_RE =
  /\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\b\s+(?:to|will|should|owns|is going to|is to)\b/;
const DATE_RE =
  /\b(?:by|before|due|on)\s+((?:next\s+)?(?:mon|tues|wednes|thurs|fri|satur|sun)day|\d{1,2}\s+\w+|\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?|end of (?:day|week|month)|tomorrow|today)\b/i;

export async function summarizeMeeting(notes: string): Promise<MeetingSummary> {
  await delay(800);
  const body = clean(notes);
  if (body.length < 30) {
    throw new AiServiceError(
      "Paste at least a few lines of meeting notes so the summary is based on real content.",
    );
  }

  const all = lines(notes);
  const decisions = all.filter((l) => /\b(decided|agreed|approved|resolved|sign(ed)? off)\b/i.test(l));
  const actionLines = all.filter((l) =>
    /\b(will|to |action|follow up|send|prepare|review|draft|schedule|confirm|owns)\b/i.test(l),
  );
  const keyPoints = all
    .filter((l) => !decisions.includes(l))
    .slice(0, 6)
    .map((l) => l.replace(/^[-•*]\s*/, ""));

  const actionItems: ActionItem[] = actionLines.slice(0, 8).map((line) => {
    const owner = line.match(OWNER_RE)?.[1];
    const deadline = line.match(DATE_RE)?.[1];
    return {
      id: uid(),
      description: sentenceCase(line.replace(/^[-•*]\s*/, "")),
      owner: owner ?? NOT_SPECIFIED,
      deadline: deadline ?? NOT_SPECIFIED,
    };
  });

  const words = body.split(" ");
  const summary =
    words.length > 60
      ? `${words.slice(0, 55).join(" ")}… The notes cover ${all.length} discussion points, ${decisions.length} recorded decision(s) and ${actionItems.length} follow-up(s).`
      : `${body} (${decisions.length} recorded decision(s), ${actionItems.length} follow-up(s).)`;

  return {
    summary,
    keyPoints: keyPoints.length ? keyPoints : [NOT_SPECIFIED],
    decisions: decisions.length ? decisions.map((d) => sentenceCase(d.replace(/^[-•*]\s*/, ""))) : [NOT_SPECIFIED],
    actionItems,
  };
}

/* --------------------------------- planner --------------------------------- */

const weight: Record<Level, number> = { low: 1, medium: 2, high: 3 };

function fmtTime(minutesFromStart: number) {
  const total = 9 * 60 + minutesFromStart;
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function bucketFor(t: TaskInput): ScheduledTask["bucket"] {
  if (t.urgency === "high" && t.importance === "high") return "Do first";
  if (t.importance === "high") return "Schedule";
  if (t.urgency === "high") return "Delegate or batch";
  return "Backlog";
}

export async function planTasks(tasks: TaskInput[]): Promise<TaskPlan> {
  await delay(650);
  const valid = tasks.filter((t) => clean(t.name));
  if (!valid.length) {
    throw new AiServiceError("Add at least one task with a name before generating a plan.");
  }

  const scored = valid
    .map((t) => {
      const deadlineBoost = t.deadline
        ? Math.max(0, 6 - Math.floor((new Date(t.deadline).getTime() - Date.now()) / 86_400_000))
        : 0;
      return {
        ...t,
        score: weight[t.urgency] * 3 + weight[t.importance] * 2 + Math.min(deadlineBoost, 6),
      };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline);
      if (a.deadline) return -1;
      if (b.deadline) return 1;
      return a.durationMinutes - b.durationMinutes;
    });

  let cursor = 0;
  const scheduled: ScheduledTask[] = scored.map((t, i) => {
    const start = cursor;
    const end = start + t.durationMinutes;
    cursor = end + 10; // 10-minute buffer keeps blocks from overlapping
    return {
      ...t,
      order: i + 1,
      start: fmtTime(start),
      end: fmtTime(end),
      bucket: bucketFor(t),
    };
  });

  const assumptions: string[] = [
    "Work day starts at 09:00 and blocks run back-to-back with a 10-minute buffer, so no two tasks overlap.",
  ];
  const noDeadline = valid.filter((t) => !t.deadline);
  if (noDeadline.length) {
    assumptions.push(
      `No deadline was given for: ${noDeadline.map((t) => t.name).join(", ")} — these were ordered by urgency and importance only, not by an assumed date.`,
    );
  }
  const longTasks = valid.filter((t) => t.durationMinutes > 180);
  if (longTasks.length) {
    assumptions.push(
      `${longTasks.map((t) => t.name).join(", ")} exceed(s) three hours and may need splitting across days.`,
    );
  }
  if (cursor > 8 * 60) {
    assumptions.push(
      "Total estimated duration exceeds a standard 8-hour day; lower-priority blocks will roll over.",
    );
  }

  return { scheduled, assumptions };
}

/* --------------------------------- research -------------------------------- */

export async function researchBrief(input: ResearchInput): Promise<ResearchBrief> {
  await delay(750);
  const topic = clean(input.topic);
  if (!topic) throw new AiServiceError("Enter a topic or question to research.");

  const source = lines(input.source);
  const hasSource = source.length > 0;
  const pool = hasSource ? source : [];

  const summary = hasSource
    ? `Based only on the source material you pasted about "${topic}": ${pool.slice(0, 3).join(" ")}`
    : `No source material was provided for "${topic}", so this brief structures the question rather than asserting facts. Paste an article, report or notes to get grounded findings.`;

  const keyInsights = hasSource
    ? pool.slice(0, 4).map((l) => sentenceCase(l.replace(/^[-•*]\s*/, "")))
    : [
        `Define what a useful answer to "${topic}" looks like before gathering sources.`,
        "Identify two or three primary sources you already trust.",
        "Note which parts of the question are time-sensitive.",
      ];

  const findings = hasSource
    ? pool.slice(4, 9).map((l) => sentenceCase(l.replace(/^[-•*]\s*/, "")))
    : [NOT_SPECIFIED];

  const recommendations = hasSource
    ? pool
        .filter((l) => /\b(should|recommend|need to|consider|opportunity|risk)\b/i.test(l))
        .slice(0, 4)
        .map((l) => sentenceCase(l.replace(/^[-•*]\s*/, "")))
    : [
        `Collect source material on "${topic}" and re-run this brief.`,
        "Assign an owner to verify the findings against the original sources.",
      ];

  return {
    summary,
    keyInsights,
    findings: findings.length ? findings : [NOT_SPECIFIED],
    recommendations: recommendations.length ? recommendations : [NOT_SPECIFIED],
    simplified: hasSource
      ? `In plain terms: ${topic} — ${pool[0] ?? NOT_SPECIFIED}`
      : `In plain terms: "${topic}" is still an open question here. Nothing has been concluded because no source was supplied.`,
  };
}

/* -------------------------------- assistant -------------------------------- */

const OFF_TOPIC =
  /\b(recipe|football|movie|celebrity|horoscope|lottery|dating|weather forecast)\b/i;

export async function assistantReply(
  message: string,
  prefs?: Partial<Preferences>,
): Promise<string> {
  await delay(650);
  const q = clean(message);
  if (!q) throw new AiServiceError("Type a question first.");

  if (OFF_TOPIC.test(q)) {
    return "I'm focused on workplace productivity — planning, prioritisation, communication and business administration. Ask me about scheduling a week, structuring an email, running a meeting or tidying an admin process.";
  }

  const detailed = prefs?.responseLength === "detailed";
  const topicLine = `**On "${q}"** — here's a practical way to approach it:`;

  let steps: string[] = [];
  if (/email|message|write|reply|communicat/i.test(q)) {
    steps = [
      "State the purpose in the first sentence so the reader knows why it landed.",
      "Give only the facts you actually have — leave gaps as open questions rather than guesses.",
      "End with one clear request and a realistic timeframe.",
      "Draft it in **Smart Email** so the tone stays consistent with your other messages.",
    ];
  } else if (/meeting|notes|minutes|standup/i.test(q)) {
    steps = [
      "Capture decisions separately from discussion — they are what people act on.",
      "Every action item needs an owner and a date; mark unknowns as \"Not specified\" instead of assuming.",
      "Circulate the summary the same day while context is fresh.",
      "Run the transcript through **Meeting Notes**, then push the action items into the planner.",
    ];
  } else if (/plan|priorit|schedule|deadline|time|busy|workload/i.test(q)) {
    steps = [
      "List everything first — unlisted work is what breaks a schedule.",
      "Score each task on urgency and importance; urgent + important goes first.",
      "Block realistic durations with buffers so the day doesn't overlap itself.",
      "Use **Task Planner** to turn the list into an ordered, non-overlapping plan.",
    ];
  } else if (/research|market|competitor|report|analy/i.test(q)) {
    steps = [
      "Write the question you actually need answered, not the broad topic.",
      "Gather source material before drawing conclusions.",
      "Separate findings from recommendations so reviewers can challenge each.",
      "Use **Research Assistant**, then verify anything decision-critical at source.",
    ];
  } else {
    steps = [
      "Break the work into capture, understand, plan, communicate and act.",
      "Decide what \"done\" looks like before starting.",
      "Note which facts you have and which you're missing — don't fill gaps with assumptions.",
      "Pick the OpsFlow tool that matches the stage you're at.",
    ];
  }

  const tail = detailed
    ? "\n\nIf you share the specifics (people involved, dates, constraints), I can structure it more precisely."
    : "";

  return `${topicLine}\n\n${steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}${tail}`;
}
