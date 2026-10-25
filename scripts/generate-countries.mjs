// Generates app/lib/countries.slim.json from the world-countries dataset.
// The full dataset is ~1.4 MB; only these fields are ever used by the app.
// Run with: pnpm countries:generate
import { readFileSync, writeFileSync } from "node:fs";

const source = new URL(
  "../node_modules/world-countries/countries.json",
  import.meta.url,
);
const target = new URL("../app/lib/countries.slim.json", import.meta.url);

const countries = JSON.parse(readFileSync(source, "utf8"));

const slim = countries.map((country) => ({
  value: country.cca2,
  label: country.name.common,
  flag: country.flag,
  region: country.region,
  latLang: country.latlng,
}));

writeFileSync(target, `${JSON.stringify(slim)}\n`);

console.log(`Wrote ${slim.length} countries to app/lib/countries.slim.json`);
