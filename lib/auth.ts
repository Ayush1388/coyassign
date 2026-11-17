/**
 * The assignment says to assume a single logged-in user and no external auth.
 * Everything that would normally come from a session reads this one constant,
 * so swapping in real auth later only touches this file.
 */
export const CURRENT_USER_ID = "me";
