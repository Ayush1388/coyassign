/** The demo reset is always on locally and opt-in in production (DEMO_RESET=true). */
export const demoResetEnabled = () =>
  process.env.DEMO_RESET === "true" || process.env.NODE_ENV !== "production";
