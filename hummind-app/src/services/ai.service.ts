import { safeFetch, type SafeResponse } from "./safeFetch";

export type LiveAction = "START" | "NEXT" | "REEXPLAIN" | "QUIZ" | "ANSWER";

export interface HummindTurn {
  message: string;
  microObjective: string;
  interactionKind: "explain" | "quiz" | "exercise" | "checkpoint";
  question: string | null;
  choices: string[] | null;
  correctIndexes: number[] | null;
  hint: string | null;
  conceptKey: string | null;
  conceptLabel: string | null;
  nextAction: "continue" | "quiz" | "practice" | "review";
  difficulty: "easy" | "medium" | "hard";
  advanceLesson: boolean;
}

export interface LiveSessionResponse {
  turn: HummindTurn;
  usage: { totalTokens: number };
}

export interface LiveSessionPayload {
  action: LiveAction;
  course: {
    id: string;
    title: string;
    description?: string;
    domain?: string;
    level?: string;
    objectives?: string[];
  };
  lesson: {
    id: string;
    moduleId: string;
    moduleTitle: string;
    kind: "lesson" | "quiz" | "exercise";
    title: string;
    paragraphs?: string[];
    contextLines?: string[];
    quiz?: Record<string, unknown> | null;
    exercisePrompt?: string;
    exerciseSolution?: string;
  };
  answer?: {
    choiceIndex?: number | null;
    text?: string;
  };
  sessionId?: string;
}

export interface LiveSessionStreamHandlers {
  onDelta?: (text: string) => void;
  onDone?: (turn: HummindTurn) => void;
  onError?: (message: string) => void;
}

function getStreamApiBaseUrl(): string | null {
  const raw =
    process.env.NEXT_PUBLIC_NEST_API_URL ?? process.env.NEXT_PUBLIC_API_BASE;
  if (!raw) return null;
  const trimmed = raw.trim().replace(/\/+$/, "");
  return /\/api\/v1$/i.test(trimmed) ? trimmed : `${trimmed}/api/v1`;
}

function readAuthToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(^| )hm_access=([^;]+)/);
  return match ? decodeURIComponent(match[2]) : null;
}

// ============================================================================
// live-tutor
// ============================================================================
export type TutorAction =
  | "INTRO"
  | "ASK"
  | "PROGRESS"
  | "QUIZ_FEEDBACK"
  | "EXERCISE_FEEDBACK";

export interface LiveTutorPayload {
  action: TutorAction;
  language?: string;
  course: {
    id: string;
    title: string;
    description?: string;
    domain?: string;
    level?: string;
    objectives?: string[];
  };
  step: {
    id: string;
    kind: "lesson" | "quiz" | "exercise";
    title: string;
    paragraphs?: string[];
    quiz?: Record<string, unknown> | null;
    exercisePrompt?: string;
    exerciseSolution?: string;
  };
  nextStep?: LiveTutorPayload["step"];
  progressionEnabled?: boolean;
  learner: {
    message?: string;
    answer?: string;
    answerIndex?: number | null;
    exerciseAttempt?: string;
  };
}

export interface LiveTutorResponse {
  reply: {
    message: string;
    suggestedPrompts: string[];
    evaluation: string | null;
    canContinue: boolean;
  };
}

// ============================================================================
// course-generate-progressive
// ============================================================================
export interface CourseGenerateContext {
  title: string;
  description?: string;
  objectives?: string[];
  domain?: string;
  level?: string;
  style?: string;
}

export interface CourseGenerateResponse {
  actions: Array<{
    type: "ADD_BLOCK";
    moduleId: string;
    toIndex: number | null;
    block: Record<string, unknown>;
  }>;
  plan: Array<{ title: string; description: string }>;
  usage: { inputTokens: number; outputTokens: number; totalTokens: number };
}

// ============================================================================
// image-*
// ============================================================================
export type ImageSize = "1024x1024" | "1024x1536" | "1536x1024" | "auto";

export interface ImageGenerateResponse {
  url: string;
  prompt: string;
  revisedPrompt: string | null;
}

export interface ImageBatchResponse {
  results: Array<{ id: string; url: string | null; error: string | null }>;
  usage: { generatedCount: number; errorCount: number };
}

export interface ImageSearchResponse {
  results: Array<{
    title: string;
    imageUrl: string;
    source: string | null;
    license: string | null;
  }>;
}

export class AiService {
  static async liveSession(
    payload: LiveSessionPayload,
  ): Promise<SafeResponse<LiveSessionResponse>> {
    return safeFetch<LiveSessionResponse>("/ai/live-session", {
      method: "POST",
      body: payload as unknown as Record<string, unknown>,
      timeoutMs: 60_000,
    });
  }

  /**
   * Streaming version. Calls /ai/live-session/stream and parses SSE events:
   *  - delta: { text } — incremental message text from Hummind
   *  - done:  { turn } — full HummindTurn ready to render
   *  - error: { message }
   * Returns an abort controller so callers can cancel mid-stream.
   */
  static async liveTutor(
    payload: LiveTutorPayload,
  ): Promise<SafeResponse<LiveTutorResponse>> {
    return safeFetch<LiveTutorResponse>("/ai/live-tutor", {
      method: "POST",
      body: payload as unknown as Record<string, unknown>,
      timeoutMs: 60_000,
    });
  }

  static async courseGenerateProgressive(payload: {
    context: CourseGenerateContext;
    extractedData?: string;
  }): Promise<SafeResponse<CourseGenerateResponse>> {
    return safeFetch<CourseGenerateResponse>(
      "/ai/course-generate-progressive",
      {
        method: "POST",
        body: payload as unknown as Record<string, unknown>,
        timeoutMs: 300_000, // génération multi-modules, peut être long
      },
    );
  }

  static async imageGenerate(payload: {
    prompt: string;
    size?: ImageSize;
  }): Promise<SafeResponse<ImageGenerateResponse>> {
    return safeFetch<ImageGenerateResponse>("/ai/image-generate", {
      method: "POST",
      body: payload as unknown as Record<string, unknown>,
      timeoutMs: 120_000,
    });
  }

  static async imageBatch(payload: {
    images: Array<{ id?: string; prompt: string; size?: ImageSize }>;
    concurrency?: number;
  }): Promise<SafeResponse<ImageBatchResponse>> {
    return safeFetch<ImageBatchResponse>("/ai/image-generate-batch", {
      method: "POST",
      body: payload as unknown as Record<string, unknown>,
      timeoutMs: 300_000,
    });
  }

  static async imageSearch(payload: {
    query: string;
    limit?: number;
  }): Promise<SafeResponse<ImageSearchResponse>> {
    return safeFetch<ImageSearchResponse>("/ai/image-search", {
      method: "POST",
      body: payload as unknown as Record<string, unknown>,
      timeoutMs: 60_000,
    });
  }

  static streamLiveSession(
    payload: LiveSessionPayload,
    handlers: LiveSessionStreamHandlers,
  ): AbortController {
    const controller = new AbortController();
    const baseUrl = getStreamApiBaseUrl();

    if (!baseUrl) {
      handlers.onError?.("Base URL non definie");
      return controller;
    }

    const token = readAuthToken();
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    void (async () => {
      try {
        const response = await fetch(`${baseUrl}/ai/live-session/stream`, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          const text = await response.text().catch(() => "");
          handlers.onError?.(text || `HTTP ${response.status}`);
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let separatorIndex = buffer.indexOf("\n\n");
          while (separatorIndex !== -1) {
            const rawEvent = buffer.slice(0, separatorIndex);
            buffer = buffer.slice(separatorIndex + 2);
            parseSseEvent(rawEvent, handlers);
            separatorIndex = buffer.indexOf("\n\n");
          }
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        handlers.onError?.(
          err instanceof Error ? err.message : "Erreur réseau",
        );
      }
    })();

    return controller;
  }
}

function parseSseEvent(
  rawEvent: string,
  handlers: LiveSessionStreamHandlers,
): void {
  let eventName = "message";
  const dataLines: string[] = [];

  for (const line of rawEvent.split("\n")) {
    if (line.startsWith("event:")) {
      eventName = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trimStart());
    }
  }

  if (dataLines.length === 0) return;

  let payload: unknown;
  try {
    payload = JSON.parse(dataLines.join("\n"));
  } catch {
    return;
  }

  if (eventName === "delta") {
    const text = (payload as { text?: string }).text;
    if (typeof text === "string") handlers.onDelta?.(text);
  } else if (eventName === "done") {
    const turn = (payload as { turn?: HummindTurn }).turn;
    if (turn) handlers.onDone?.(turn);
  } else if (eventName === "error") {
    const message = (payload as { message?: string }).message;
    handlers.onError?.(message ?? "Erreur inconnue");
  }
}
