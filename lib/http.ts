import { NextResponse } from "next/server";

const NO_STORE = { "Cache-Control": "no-store" };

export function json<T>(body: T, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE });
}

export type ErrorCode = "INVALID_INPUT" | "NOT_FOUND" | "ALREADY_SWIPED" | "FORBIDDEN" | "INTERNAL";

/** Errors have one shape and never carry DB internals or stack traces. */
export function apiError(status: number, code: ErrorCode, message: string, details?: unknown) {
  return json({ error: { code, message, ...(details ? { details } : {}) } }, status);
}

export function internalError(scope: string, err: unknown) {
  // Log only the message, never request bodies or matching data.
  console.error(`[${scope}]`, err instanceof Error ? err.message : "unknown error");
  return apiError(500, "INTERNAL", "Something went wrong. Please try again.");
}
