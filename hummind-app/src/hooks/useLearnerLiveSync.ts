"use client";

import { useCallback, useEffect, useRef } from "react";
import { safeFetch } from "../services/safeFetch";

// ─── Types matching the backend session shape ───

interface SessionData {
  messages: unknown[];
  quizAnswers: Record<string, unknown>;
  exerciseDrafts: Record<string, string>;
  exerciseEvaluations: Record<string, string>;
  completedStepIds: string[];
  lastStepId: string | null;
}

type BackendSessions = Record<string, SessionData>;

// ─── Storage keys (must match useCourseLiveTutorSession) ───

function getSessionStorageKey(courseId: string) {
  return `hummind-live:sessions:${courseId}`;
}

function getStepStorageKey(courseId: string) {
  return `hummind-live:selected-step:${courseId}`;
}

// ─── Convert between frontend StepSession format and backend module format ───

interface StepSession {
  started: boolean;
  messages: unknown[];
  quizCursor: number;
  quizAttempts: number;
  exerciseDraft: string;
  exerciseEvaluation: string;
  exerciseCanContinue: boolean;
  [key: string]: unknown;
}

/**
 * Groups step sessions by moduleId using the step→module mapping.
 */
function groupByModule(
  sessions: Record<string, StepSession>,
  stepToModule: Map<string, string>,
): Record<string, SessionData> {
  const modules: Record<string, SessionData> = {};

  for (const [stepId, session] of Object.entries(sessions)) {
    const moduleId = stepToModule.get(stepId);
    if (!moduleId) continue;

    if (!modules[moduleId]) {
      modules[moduleId] = {
        messages: [],
        quizAnswers: {},
        exerciseDrafts: {},
        exerciseEvaluations: {},
        completedStepIds: [],
        lastStepId: null,
      };
    }

    const mod = modules[moduleId];

    // Accumulate messages from all steps in this module
    if (session.messages?.length > 0) {
      mod.messages.push(
        ...session.messages.map((m: unknown) => ({
          ...(m as Record<string, unknown>),
          _stepId: stepId,
        })),
      );
    }

    // Track exercise drafts and evaluations
    if (session.exerciseDraft) {
      mod.exerciseDrafts[stepId] = session.exerciseDraft;
    }
    if (session.exerciseEvaluation && session.exerciseEvaluation !== "none") {
      mod.exerciseEvaluations[stepId] = session.exerciseEvaluation;
    }

    // Track completed steps
    if (session.started && session.messages?.length > 0) {
      mod.completedStepIds.push(stepId);
    }

    // Last step is the most recently active
    mod.lastStepId = stepId;
  }

  return modules;
}

/**
 * Restores step sessions from backend module sessions.
 */
function restoreFromModules(
  backendSessions: BackendSessions,
): Record<string, StepSession> {
  const restored: Record<string, StepSession> = {};

  for (const [, modData] of Object.entries(backendSessions)) {
    // Group messages by their _stepId
    const messagesByStep = new Map<string, unknown[]>();

    for (const msg of modData.messages as Array<Record<string, unknown>>) {
      const stepId = (msg._stepId as string) || "unknown";
      if (!messagesByStep.has(stepId)) messagesByStep.set(stepId, []);
      // Remove the _stepId metadata before restoring
      const { _stepId, ...cleanMsg } = msg;
      messagesByStep.get(stepId)!.push(cleanMsg);
    }

    for (const [stepId, msgs] of messagesByStep) {
      restored[stepId] = {
        started: true,
        pending: false,
        pendingLabel: null,
        messages: msgs,
        activeQuizMessageId: null,
        quizCursor: 0,
        quizAttempts: 0,
        lastQuizChoiceIndex: null,
        lastQuizEvaluation: null,
        exerciseDraft: modData.exerciseDrafts?.[stepId] ?? "",
        exerciseEvaluation: modData.exerciseEvaluations?.[stepId] ?? "none",
        exerciseCanContinue:
          modData.exerciseEvaluations?.[stepId] === "strong",
        error: null,
      };
    }
  }

  return restored;
}

// ─── Hook ───

interface UseLearnerLiveSyncOptions {
  courseId: string;
  /** Map of stepId → moduleId, built from the course content */
  stepToModule: Map<string, string>;
  /** Called when backend sessions are loaded */
  onSessionsLoaded?: (lastStepId: string | null) => void;
}

export function useLearnerLiveSync({
  courseId,
  stepToModule,
  onSessionsLoaded,
}: UseLearnerLiveSyncOptions) {
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>("");
  const loadedRef = useRef(false);

  // ─── Load from backend on mount ───
  useEffect(() => {
    if (!courseId || loadedRef.current) return;
    loadedRef.current = true;

    async function loadSessions() {
      const res = await safeFetch<BackendSessions>(
        `/learner/session/${courseId}`,
        { method: "GET" },
      );

      if (!res.data || Object.keys(res.data).length === 0) {
        onSessionsLoaded?.(null);
        return;
      }

      // Restore into sessionStorage so the existing hook picks them up
      const restored = restoreFromModules(res.data);

      if (Object.keys(restored).length > 0) {
        try {
          window.localStorage.setItem(
            getSessionStorageKey(courseId),
            JSON.stringify(restored),
          );
        } catch {
          // Ignore storage errors
        }
      }

      // Find the last step across all modules
      let lastStepId: string | null = null;
      for (const [, modData] of Object.entries(res.data)) {
        if (modData.lastStepId) lastStepId = modData.lastStepId;
      }

      if (lastStepId) {
        try {
          window.localStorage.setItem(
            getStepStorageKey(courseId),
            lastStepId,
          );
        } catch {
          // Ignore
        }
      }

      onSessionsLoaded?.(lastStepId);
    }

    void loadSessions();
  }, [courseId, onSessionsLoaded]);

  // ─── Save to backend (debounced) ───
  const syncToBackend = useCallback(() => {
    if (!courseId || stepToModule.size === 0) return;

    // Read current sessions from sessionStorage
    let sessions: Record<string, StepSession> = {};
    try {
      const raw = window.localStorage.getItem(getSessionStorageKey(courseId));
      if (raw) sessions = JSON.parse(raw);
    } catch {
      return;
    }

    // Skip if nothing changed
    const signature = JSON.stringify(sessions);
    if (signature === lastSavedRef.current) return;

    // Debounce: cancel previous timer
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(async () => {
      const grouped = groupByModule(sessions, stepToModule);

      // Save each module, retry once on failure
      const entries = Object.entries(grouped);
      const results = await Promise.allSettled(
        entries.map(([moduleId, data]) =>
          safeFetch(`/learner/session/${courseId}/${moduleId}`, {
            method: "PUT",
            body: data as unknown as Record<string, unknown>,
          }),
        ),
      );

      // Only mark as saved if all succeeded
      const allOk = results.every(
        (r) => r.status === "fulfilled" && r.value.status < 400,
      );
      if (allOk) {
        lastSavedRef.current = signature;
      }
    }, 2000);
  }, [courseId, stepToModule]);

  // ─── Immediate save (for critical actions like quiz answers) ───
  const syncNow = useCallback(() => {
    if (!courseId || stepToModule.size === 0) return;

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    let sessions: Record<string, StepSession> = {};
    try {
      const raw = window.localStorage.getItem(getSessionStorageKey(courseId));
      if (raw) sessions = JSON.parse(raw);
    } catch {
      return;
    }

    const grouped = groupByModule(sessions, stepToModule);

    // Best-effort sync on critical moments (unload, step change)
    for (const [moduleId, data] of Object.entries(grouped)) {
      try {
        safeFetch(`/learner/session/${courseId}/${moduleId}`, {
          method: "PUT",
          body: data as unknown as Record<string, unknown>,
        });
      } catch {
        // Ignore on unload — data is also in sessionStorage
      }
    }
    lastSavedRef.current = JSON.stringify(sessions);
  }, [courseId, stepToModule]);

  // ─── Auto-sync on session storage changes ───
  useEffect(() => {
    if (!courseId) return;

    const handleStorage = () => syncToBackend();

    // Listen for sessionStorage changes from the tutor hook
    const interval = setInterval(syncToBackend, 5000);

    return () => {
      clearInterval(interval);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [courseId, syncToBackend]);

  // ─── Save on page unload ───
  useEffect(() => {
    const handleBeforeUnload = () => syncNow();
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [syncNow]);

  return { syncToBackend, syncNow };
}
