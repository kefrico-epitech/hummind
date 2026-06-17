import { readAuthTokenFromDocument } from "./http/auth";
import { resolveApiBaseUrl } from "./http/baseUrl";
import {
  isJsonStringBody,
  isSerializableBody,
  type JsonBody,
} from "./http/body";
import { extractErrorMessage, getErrorMessage } from "./http/errors";

export interface SafeResponse<T = unknown> {
  status: number;
  data: T | null;
  error: string | null;
}

type SafeFetchOptions = Omit<RequestInit, "body"> & {
  body?: BodyInit | JsonBody | null;
  timeoutMs?: number;
  token?: string | null;
};

const DEFAULT_TIMEOUT_MS = 30_000;

function buildHeaders(
  body: unknown,
  token: string | null,
  extra: HeadersInit | undefined,
): HeadersInit {
  const wantsJson = isSerializableBody(body) || isJsonStringBody(body);
  return {
    ...(wantsJson ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

function serializeBody(body: unknown): BodyInit | undefined {
  if (body === null || body === undefined) return undefined;
  return isSerializableBody(body) ? JSON.stringify(body) : (body as BodyInit);
}

export async function safeFetch<T = unknown>(
  endpoint: string,
  options: SafeFetchOptions = {},
): Promise<SafeResponse<T>> {
  const baseUrl = resolveApiBaseUrl();
  if (!baseUrl) {
    return { status: 500, data: null, error: "Base URL non definie" };
  }

  const {
    body: rawBody,
    headers: rawHeaders,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    token: explicitToken,
    signal: externalSignal,
    ...rest
  } = options;

  const token = explicitToken ?? readAuthTokenFromDocument();
  const headers = buildHeaders(rawBody, token, rawHeaders);
  const body = serializeBody(rawBody);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else externalSignal.addEventListener("abort", () => controller.abort());
  }

  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      ...rest,
      headers,
      body,
      signal: controller.signal,
    });

    const data: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        status: response.status,
        data: null,
        error: extractErrorMessage(data),
      };
    }

    return { status: response.status, data: data as T, error: null };
  } catch (error) {
    return { status: 500, data: null, error: getErrorMessage(error) };
  } finally {
    clearTimeout(timeoutId);
  }
}
