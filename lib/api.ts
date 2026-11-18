import type { MatchDTO, MessageDTO, PublicProfile } from "./dto";
import type { SwipeAction } from "./validation";

export type { MatchDTO, MessageDTO, PublicProfile, SwipeAction };

export type SwipeResponse =
  | { success: true; matched: false; match: null }
  | { success: true; matched: true; match: MatchDTO };

export type Filters = {
  minAge?: number;
  maxAge?: number;
  maxKm?: number;
  intents?: string[];
  drinking?: string[];
  smoking?: string[];
  workout?: string[];
  interests?: string[];
  languages?: string[];
  verified?: boolean;
  shared?: boolean;
};

export type Me = { name: string; city: string; interests: string[]; intent: string | null };
export type FilterOptions = { interests: string[]; languages: string[] };

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

export function feedQuery(f: Filters) {
  const q = new URLSearchParams();
  if (f.minAge != null) q.set("minAge", String(f.minAge));
  if (f.maxAge != null) q.set("maxAge", String(f.maxAge));
  if (f.maxKm != null) q.set("maxKm", String(f.maxKm));
  for (const key of ["intents", "drinking", "smoking", "workout", "interests", "languages"] as const) {
    const v = f[key];
    if (v?.length) q.set(key, v.join(","));
  }
  if (f.verified) q.set("verified", "1");
  if (f.shared) q.set("shared", "1");
  const s = q.toString();
  return s ? `?${s}` : "";
}

export const api = {
  feed: (filters: Filters = {}) =>
    request<{ profiles: PublicProfile[] }>(`/api/feed${feedQuery(filters)}`).then((r) => r.profiles),
  me: () => request<{ me: Me; options: FilterOptions }>("/api/me"),
  matches: () => request<{ matches: MatchDTO[] }>("/api/matches").then((r) => r.matches),
  sentLikes: () => request<{ profiles: PublicProfile[] }>("/api/likes/sent").then((r) => r.profiles),
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
