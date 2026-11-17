import type { MatchDTO, PublicProfile } from "./dto";
import type { SwipeAction } from "./validation";

export type { MatchDTO, PublicProfile, SwipeAction };

export type SwipeResponse =
  | { success: true; matched: false; match: null }
  | { success: true; matched: true; match: MatchDTO };

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, { cache: "no-store", ...init });
  } catch {
    throw new ApiError(0, "NETWORK", "You seem to be offline.");
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(res.status, body?.error?.code ?? "UNKNOWN", body?.error?.message ?? "Something went wrong.");
  }
  return body as T;
}

export const api = {
  feed: () => request<{ profiles: PublicProfile[] }>("/api/feed").then((r) => r.profiles),
  matches: () => request<{ matches: MatchDTO[] }>("/api/matches").then((r) => r.matches),
  swipe: (profileId: string, action: SwipeAction) =>
    request<SwipeResponse>("/api/swipe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ profileId, action }),
    }),
  resetDemo: () => request<{ success: true }>("/api/dev/reset", { method: "POST" }),
};
