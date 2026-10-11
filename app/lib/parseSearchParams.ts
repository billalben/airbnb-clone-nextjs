import { categoryItems } from "./categoryItems";
import { getAllCountries } from "./getCountries";

const validFilters = new Set(categoryItems.map((c) => c.name));
const validCountries = new Set(getAllCountries().map((c) => c.value));

function firstString(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export function parseFilter(
  raw: string | string[] | undefined,
): string | undefined {
  const value = firstString(raw);
  if (!value) return undefined;
  return validFilters.has(value) ? value : undefined;
}

export function parseCountry(
  raw: string | string[] | undefined,
): string | undefined {
  const value = firstString(raw);
  if (!value) return undefined;
  return validCountries.has(value) ? value : undefined;
}

export function clampCount(value: number, max = 10): number {
  return Math.max(0, Math.min(max, Math.trunc(value)));
}

export function parseCount(
  raw: string | string[] | undefined,
  max = 10,
): number | undefined {
  const value = firstString(raw);
  if (!value) return undefined;
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n)) return undefined;
  return clampCount(n, max);
}

// Re-clamp a numeric filter argument received by a server action so callers
// cannot bypass validation by invoking the action directly.
export function clampCountArg(
  raw: number | undefined,
  max = 10,
): number | undefined {
  if (typeof raw !== "number" || !Number.isFinite(raw)) return undefined;
  return clampCount(raw, max);
}

export type ParsedSearchParams = {
  filter?: string;
  country?: string;
  guest?: number;
  room?: number;
  bathroom?: number;
};

export function parseSearchParams(
  raw: Record<string, string | string[] | undefined> | undefined,
): ParsedSearchParams {
  if (!raw) return {};
  return {
    filter: parseFilter(raw.filter),
    country: parseCountry(raw.country),
    guest: parseCount(raw.guest),
    room: parseCount(raw.room),
    bathroom: parseCount(raw.bathroom),
  };
}
