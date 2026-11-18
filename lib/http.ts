import { NextResponse } from "next/server";

const NO_STORE = { "Cache-Control": "no-store" };

export function json<T>(body: T, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE });
}

export type ErrorCode =
  | "INVALID_INPUT"
  | "UNSUPPORTED_MEDIA_TYPE"
  | "NOT_FOUND"
  | "ALREADY_SWIPED"
  | "FORBIDDEN"
  | "INTERNAL";

/** Errors have one shape and never carry DB internals or stack traces. */
export function apiError(status: number, code: ErrorCode, message: string, details?: unknown) {
  return json({ error: { code, message, ...(details ? { details } : {}) } }, status);
}

/**
 * Reads a JSON request body, and only accepts `Content-Type: application/json`.
 * A cross-site HTML form can't send that content type, and a cross-origin fetch with it
 * needs a CORS preflight that this API never grants, so state-changing routes are not
 * reachable from another website (a CSRF defence that needs no tokens or cookies).
 */
export async function readJsonBody(request: Request): Promise<{ body: unknown } | { error: Response }> {
  const type = (request.headers.get("content-type") ?? "").toLowerCase();
  if (!type.startsWith("application/json")) {
    return { error: apiError(415, "UNSUPPORTED_MEDIA_TYPE", "Content-Type must be application/json.") };
  }
  try {
    return { body: (await request.json()) as unknown };
  } catch {
    return { error: apiError(400, "INVALID_INPUT", "Request body must be valid JSON.") };
  }
}

export function internalError(scope: string, err: unknown) {
  // Log only the message, never request bodies or matching data.
  console.error(`[${scope}]`, err instanceof Error ? err.message : "unknown error");
  return apiError(500, "INTERNAL", "Something went wrong. Please try again.");
}
