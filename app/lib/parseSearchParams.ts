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

export function parseCount(
  raw: string | string[] | undefined,
  max = 10,
): string | undefined {
  const value = firstString(raw);
  if (!value) return undefined;
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n)) return undefined;
  const clamped = Math.max(0, Math.min(max, n));
  return String(clamped);
}

export type ParsedSearchParams = {
  filter?: string;
  country?: string;
  guest?: string;
  room?: string;
  bathroom?: string;
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
