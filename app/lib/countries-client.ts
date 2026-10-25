import countries from "./countries.slim.json";

export type CountryOption = {
  value: string;
  label: string;
  flag: string;
  region: string;
  latLang: [number, number];
};

// `countries.slim.json` is generated from world-countries by
// `pnpm countries:generate`. Keep this module client-safe: importing the full
// `world-countries` package here would put ~1.4 MB in the client bundle.
export const countryOptions = countries as CountryOption[];

export function getCountryOption(
  value: string | null | undefined,
): CountryOption | undefined {
  if (!value) return undefined;
  return countryOptions.find((item) => item.value === value);
}
