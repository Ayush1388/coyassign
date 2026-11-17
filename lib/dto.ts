import type { UserRow } from "./db/schema";

/**
 * PRIVACY BOUNDARY. Every profile that leaves the server goes through one of
 * these explicit allow-lists. We never spread DB rows into responses, so a
 * column added later cannot leak by accident.
 */
export type PublicProfile = {
  id: string;
  name: string;
  age: number;
  photoUrl: string | null;
  bio: string;
  city: string;
  college: string | null;
  interests: string[];
};

export type MatchProfile = Pick<PublicProfile, "id" | "name" | "age" | "photoUrl" | "city" | "college">;

export type MatchDTO = { id: string; createdAt: string; profile: MatchProfile };

export function toPublicProfile(u: UserRow): PublicProfile {
  return {
    id: u.id,
    name: u.name,
    age: u.age,
    photoUrl: u.photoUrl,
    bio: u.bio,
    city: u.city,
    college: u.college,
    interests: Array.isArray(u.interests) ? u.interests : [],
  };
}

export function toMatchProfile(u: UserRow): MatchProfile {
  return { id: u.id, name: u.name, age: u.age, photoUrl: u.photoUrl, city: u.city, college: u.college };
}
