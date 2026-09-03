import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  ActionItem,
  EmailInput,
  MeetingSummary,
  Preferences,
  TaskInput,
} from "./types";

const STORAGE_KEY = "opsflow.state.v1";

export interface EmailSeed extends Partial<EmailInput> {
  note?: string;
}

interface OpsFlowState {
  tasks: TaskInput[];
  meeting: MeetingSummary | null;
  meetingNotes: string;
  emailSeed: EmailSeed | null;
  preferences: Preferences;
}

const defaultState: OpsFlowState = {
  tasks: [],
  meeting: null,
  meetingNotes: "",
  emailSeed: null,
  preferences: {
    defaultTone: "formal",
    responseLength: "balanced",
    includeAssumptions: true,
    labelAiOutput: true,
  },
};

interface OpsFlowContextValue extends OpsFlowState {
  addTasks: (tasks: TaskInput[]) => void;
  replaceTasks: (tasks: TaskInput[]) => void;
  addActionItems: (items: ActionItem[]) => number;
  setMeeting: (summary: MeetingSummary | null, notes: string) => void;
  setEmailSeed: (seed: EmailSeed | null) => void;
  updatePreferences: (patch: Partial<Preferences>) => void;
}

const OpsFlowContext = createContext<OpsFlowContextValue | null>(null);

export const newTask = (patch: Partial<TaskInput> = {}): TaskInput => ({
  id: Math.random().toString(36).slice(2, 10),
  name: "",
  deadline: "",
  importance: "medium",
  urgency: "medium",
  durationMinutes: 60,
  ...patch,
});

export function OpsFlowProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OpsFlowState>(defaultState);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setState((prev) => ({ ...prev, ...(JSON.parse(raw) as OpsFlowState) }));
    } catch {
      /* ignore corrupt local state */
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable */
    }
  }, [state]);

  const addTasks = useCallback((tasks: TaskInput[]) => {
    setState((s) => ({ ...s, tasks: [...s.tasks, ...tasks] }));
  }, []);

  const replaceTasks = useCallback((tasks: TaskInput[]) => {
    setState((s) => ({ ...s, tasks }));
  }, []);

  const addActionItems = useCallback((items: ActionItem[]) => {
    const mapped = items.map((item) =>
      newTask({
        name: item.owner && item.owner !== "Not specified"
          ? `${item.description} (${item.owner})`
          : item.description,
        deadline: /^\d{4}-\d{2}-\d{2}$/.test(item.deadline) ? item.deadline : "",
        importance: "high",
        urgency: item.deadline && item.deadline !== "Not specified" ? "high" : "medium",
      }),
    );
    setState((s) => ({ ...s, tasks: [...s.tasks, ...mapped] }));
    return mapped.length;
  }, []);

  const setMeeting = useCallback((summary: MeetingSummary | null, notes: string) => {
    setState((s) => ({ ...s, meeting: summary, meetingNotes: notes }));
  }, []);

  const setEmailSeed = useCallback((seed: EmailSeed | null) => {
    setState((s) => ({ ...s, emailSeed: seed }));
  }, []);

  const updatePreferences = useCallback((patch: Partial<Preferences>) => {
    setState((s) => ({ ...s, preferences: { ...s.preferences, ...patch } }));
  }, []);

  const value = useMemo<OpsFlowContextValue>(
    () => ({
      ...state,
      addTasks,
      replaceTasks,
      addActionItems,
      setMeeting,
      setEmailSeed,
      updatePreferences,
    }),
    [state, addTasks, replaceTasks, addActionItems, setMeeting, setEmailSeed, updatePreferences],
  );

  return <OpsFlowContext.Provider value={value}>{children}</OpsFlowContext.Provider>;
}

export function useOpsFlow() {
  const ctx = useContext(OpsFlowContext);
  if (!ctx) throw new Error("useOpsFlow must be used inside OpsFlowProvider");
  return ctx;
}
