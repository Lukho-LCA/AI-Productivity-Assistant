export type Tone = "formal" | "friendly" | "persuasive";
export type ResponseLength = "concise" | "balanced" | "detailed";

export const NOT_SPECIFIED = "Not specified";

export interface EmailInput {
  recipient: string;
  purpose: string;
  keyInformation: string;
  desiredOutcome: string;
  tone: Tone;
}

export interface EmailDraft {
  subject: string;
  body: string;
}

export interface ActionItem {
  id: string;
  description: string;
  owner: string;
  deadline: string;
}

export interface MeetingSummary {
  summary: string;
  keyPoints: string[];
  decisions: string[];
  actionItems: ActionItem[];
}

export type Level = "low" | "medium" | "high";

export interface TaskInput {
  id: string;
  name: string;
  deadline: string;
  importance: Level;
  urgency: Level;
  durationMinutes: number;
}

export interface ScheduledTask extends TaskInput {
  order: number;
  score: number;
  start: string;
  end: string;
  bucket: "Do first" | "Schedule" | "Delegate or batch" | "Backlog";
}

export interface TaskPlan {
  scheduled: ScheduledTask[];
  assumptions: string[];
}

export interface ResearchInput {
  topic: string;
  source: string;
}

export interface ResearchBrief {
  summary: string;
  keyInsights: string[];
  findings: string[];
  recommendations: string[];
  simplified: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
}

export interface Preferences {
  defaultTone: Tone;
  responseLength: ResponseLength;
  includeAssumptions: boolean;
  labelAiOutput: boolean;
}

export const RESPONSIBLE_AI_NOTICE =
  "AI outputs are suggestions and may contain errors or omissions. Review and verify important information before using it in business decisions or communications.";
