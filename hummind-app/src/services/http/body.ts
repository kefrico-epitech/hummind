export type JsonBody = Record<string, unknown> | unknown[];

export function isSerializableBody(body: unknown): body is JsonBody {
  return (
    !!body &&
    typeof body === "object" &&
    !(body instanceof FormData) &&
    !(body instanceof URLSearchParams) &&
    !(body instanceof Blob) &&
    !(body instanceof ArrayBuffer) &&
    !ArrayBuffer.isView(body)
  );
}

export function isJsonStringBody(body: unknown): body is string {
  return typeof body === "string" && body.trim().length > 0;
}
