/**
 * Profile attributes people can filter on. These are all PUBLIC profile fields,
 * so filtering on them reveals nothing private. Shared by server and client.
 * "Looking for" mirrors the six relationship goals used across dating apps.
 */
export const INTENTS = [
  { id: "long_term", label: "Long-term partner", short: "Long-term", emoji: "💍" },
  { id: "long_open", label: "Long-term, open to short", short: "Long-term-ish", emoji: "😍" },
  { id: "short_open", label: "Short-term, open to long", short: "Short-term-ish", emoji: "🥂" },
  { id: "short_term", label: "Short-term fun", short: "Short-term fun", emoji: "🎉" },
  { id: "friends", label: "New friends", short: "New friends", emoji: "👋" },
  { id: "figuring", label: "Still figuring it out", short: "Figuring it out", emoji: "🤔" },
] as const;
export type IntentId = (typeof INTENTS)[number]["id"];
export const INTENT_IDS = INTENTS.map((i) => i.id) as [IntentId, ...IntentId[]];

export const DRINKING = [
  { id: "never", label: "Never", emoji: "🧃", phrase: "Doesn't drink" },
  { id: "rarely", label: "Rarely", emoji: "🍹", phrase: "Drinks rarely" },
  { id: "socially", label: "Socially", emoji: "🥂", phrase: "Drinks socially" },
] as const;
export type DrinkingId = (typeof DRINKING)[number]["id"];
export const DRINKING_IDS = DRINKING.map((d) => d.id) as [DrinkingId, ...DrinkingId[]];

export const SMOKING = [
  { id: "no", label: "Non-smoker", emoji: "🚭", phrase: "Non-smoker" },
  { id: "sometimes", label: "Sometimes", emoji: "🌫️", phrase: "Smokes sometimes" },
  { id: "yes", label: "Smoker", emoji: "🚬", phrase: "Smoker" },
] as const;
export type SmokingId = (typeof SMOKING)[number]["id"];
export const SMOKING_IDS = SMOKING.map((d) => d.id) as [SmokingId, ...SmokingId[]];

export const WORKOUT = [
  { id: "daily", label: "Active", emoji: "🏃", phrase: "Works out a lot" },
  { id: "sometimes", label: "Sometimes", emoji: "🧘", phrase: "Works out sometimes" },
  { id: "never", label: "Rarely", emoji: "🛋️", phrase: "Rarely works out" },
] as const;
export type WorkoutId = (typeof WORKOUT)[number]["id"];
export const WORKOUT_IDS = WORKOUT.map((d) => d.id) as [WorkoutId, ...WorkoutId[]];

export const intentOf = (id: string | null | undefined) => INTENTS.find((i) => i.id === id) ?? null;
export const drinkingOf = (id: string | null | undefined) => DRINKING.find((i) => i.id === id) ?? null;
export const smokingOf = (id: string | null | undefined) => SMOKING.find((i) => i.id === id) ?? null;
export const workoutOf = (id: string | null | undefined) => WORKOUT.find((i) => i.id === id) ?? null;
