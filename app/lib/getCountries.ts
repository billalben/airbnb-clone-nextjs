import countries from "world-countries";

const countriesFormatted = countries.map((item) => ({
  value: item.cca2,
  label: item.name.common,
  flag: item.flag,
  latLang: item.latlng,
  region: item.region,
}));

// Server-only: the `world-countries` dataset is ~1.4 MB. Client components must
// use `./countries-client` (backed by `countries.slim.json`) instead.
export const getAllCountries = () => countriesFormatted;

export const getCountryByValue = (value: string) => {
  return countriesFormatted.find((item) => item.value === value);
};

const validCountries = new Set(countriesFormatted.map((item) => item.value));

export const isValidCountry = (value: string | null | undefined) =>
  !!value && validCountries.has(value);
