// Shared counter bounds. Kept separate from `home-schema` so client widgets
// that only need the numbers do not pull Zod into their bundle.
export const COUNTER_MIN = 1;
export const COUNTER_MAX = 10;
