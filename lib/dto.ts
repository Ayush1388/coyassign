import type { UserRow } from "./db/schema";
import { bandBetween, sharedInterests } from "./geo";

/**
 * PRIVACY BOUNDARY. Every profile that leaves the server goes through one of
 * these explicit allow-lists. We never spread DB rows into responses, so a
 * column added later (like lat/lng) can't leak by accident.
 */
export type PublicProfile = {
  id: string;
  name: string;
  age: number;
  photoUrl: string | null;
  /** All photos, main first. */
  photos: string[];
  bio: string;
  city: string;
  college: string | null;
  interests: string[];
  verified: boolean;
  prompt: { question: string; answer: string } | null;
  /** Coarse distance band in km (0 = under 1 km), never an exact value. */
  distanceKm: number | null;
  /** Interests the viewer also listed. Derived from public data only. */
  sharedInterests: string[];
  /** Public "looking for" (see lib/profile-options.ts) and whether it matches the viewer's. */
  intent: string | null;
  sameIntent: boolean;
  lifestyle: { drinking: string | null; smoking: string | null; workout: string | null };
  languages: string[];
};

export type MatchProfile = Pick<PublicProfile, "id" | "name" | "age" | "photoUrl" | "city" | "college" | "verified">;

/** Read receipts for my own messages: delivered (✓) or seen (✓✓ blue). */
export type MessageStatus = "delivered" | "seen";

export type LastMessage = { body: string; fromMe: boolean; createdAt: string };

export type MatchDTO = {
  id: string;
  createdAt: string;
  profile: MatchProfile;
  sharedInterests: string[];
  lastMessage: LastMessage | null;
  /** True when the other person spoke last, or nobody has spoken yet. */
  yourTurn: boolean;
  /** Full public profile (photos, looking-for, lifestyle). Only sent for mutual matches. */
  details?: PublicProfile;
};

export type MessageDTO = {
  id: string;
  body: string;
  fromMe: boolean;
  createdAt: string;
  status?: MessageStatus;
  /** When they saw it (only on my own messages with status "seen"). */
  seenAt?: string;
};

const interestsOf = (u: UserRow) => (Array.isArray(u.interests) ? u.interests : []);

export function toPublicProfile(u: UserRow, viewer: UserRow): PublicProfile {
  return {
    id: u.id,
    name: u.name,
    age: u.age,
    photoUrl: u.photoUrl,
    photos: Array.isArray(u.photos) && u.photos.length ? u.photos : u.photoUrl ? [u.photoUrl] : [],
    bio: u.bio,
    city: u.city,
    college: u.college,
    interests: interestsOf(u),
    verified: u.verified,
    prompt: u.promptQuestion && u.promptAnswer ? { question: u.promptQuestion, answer: u.promptAnswer } : null,
    distanceKm: bandBetween(viewer, u),
    sharedInterests: sharedInterests(interestsOf(viewer), interestsOf(u)),
    intent: u.intent,
    sameIntent: !!u.intent && u.intent === viewer.intent,
    lifestyle: { drinking: u.drinking, smoking: u.smoking, workout: u.workout },
    languages: Array.isArray(u.languages) ? u.languages : [],
  };
}

export function toMatchProfile(u: UserRow): MatchProfile {
  return {
    id: u.id,
    name: u.name,
    age: u.age,
    photoUrl: u.photoUrl,
    city: u.city,
    college: u.college,
    verified: u.verified,
  };
}

export function sharedWith(viewer: UserRow, other: UserRow) {
  return sharedInterests(interestsOf(viewer), interestsOf(other));
}
