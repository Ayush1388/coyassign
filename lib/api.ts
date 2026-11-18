import type { MatchDTO, MessageDTO, PublicProfile } from "./dto";
import type { SwipeAction } from "./validation";

export type { MatchDTO, MessageDTO, PublicProfile, SwipeAction };

export type SwipeResponse =
  | { success: true; matched: false; match: null }
  | { success: true; matched: true; match: MatchDTO };

export type Filters = { minAge?: number; maxAge?: number; maxKm?: number };

export type Conversation = {
  match: {
    id: string;
    createdAt: string;
    profile: MatchDTO["profile"];
    sharedInterests: string[];
    prompt: { question: string; answer: string } | null;
  };
  messages: MessageDTO[];
  typing: boolean;
  starters: string[];
};

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

const jsonInit = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});

function feedQuery(f: Filters) {
  const q = new URLSearchParams();
  if (f.minAge != null) q.set("minAge", String(f.minAge));
  if (f.maxAge != null) q.set("maxAge", String(f.maxAge));
  if (f.maxKm != null) q.set("maxKm", String(f.maxKm));
  const s = q.toString();
  return s ? `?${s}` : "";
}

export const api = {
  feed: (filters: Filters = {}) =>
    request<{ profiles: PublicProfile[] }>(`/api/feed${feedQuery(filters)}`).then((r) => r.profiles),
  me: () => request<{ me: { name: string; city: string; interests: string[] } }>("/api/me").then((r) => r.me),
  matches: () => request<{ matches: MatchDTO[] }>("/api/matches").then((r) => r.matches),
  swipe: (profileId: string, action: SwipeAction) => request<SwipeResponse>("/api/swipe", jsonInit("POST", { profileId, action })),
  conversation: (matchId: string) => request<Conversation>(`/api/matches/${encodeURIComponent(matchId)}/messages`),
  send: (matchId: string, body: string) =>
    request<{ message: MessageDTO }>(`/api/matches/${encodeURIComponent(matchId)}/messages`, jsonInit("POST", { body })).then(
      (r) => r.message,
    ),
  unmatch: (matchId: string) => request<{ success: true }>(`/api/matches/${encodeURIComponent(matchId)}`, { method: "DELETE" }),
  report: (matchId: string, reason: string) =>
    request<{ success: true }>(`/api/matches/${encodeURIComponent(matchId)}/report`, jsonInit("POST", { reason })),
  resetDemo: () => request<{ success: true }>("/api/dev/reset", { method: "POST" }),
};
