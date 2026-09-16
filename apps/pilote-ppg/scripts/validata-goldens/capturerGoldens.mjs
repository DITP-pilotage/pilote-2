import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ICI = dirname(fileURLToPath(import.meta.url));
const BASE = join(ICI, "../../src/server/infrastructure/fichier-tabulaire");
const FIXTURES = join(BASE, "__fixtures__");
const GOLDENS = join(BASE, "__goldens__");

const URL_VALIDATA = "https://api.validata.etalab.studio/validate";
const BASE_SCHEMA =
  "https://raw.githubusercontent.com/DITP-pilotage/pilote-2/dev/apps/pilote-ppg/public/schema/";

const SCHEMAS = [
  "sans-contraintes.json",
  "restrict-dept.json",
  "restrict-reg.json",
  "restrict-0-100.json",
];

async function capturer(cheminFixture, nomFixture, schema) {
  const formData = new FormData();
  formData.append("file", new Blob([readFileSync(cheminFixture)]), nomFixture);
  formData.append("schema", `${BASE_SCHEMA}${schema}`);
  formData.append("include_resource_data", "true");

  const reponse = await fetch(URL_VALIDATA, { method: "POST", body: formData });

  // Un refus du service est une information de parite a part entiere : on la
  // consigne au lieu d'echouer.
  if (!reponse.ok) {
    return { erreurHttp: reponse.status, valid: false, errors: [] };
  }

  const brut = await reponse.json();
  return {
    versionValidata: brut.version,
    captureLe: brut.date,
    valid: brut.report.valid,
    stats: brut.report.stats,
    warnings: brut.report.warnings,
    errors: brut.report.errors.map((e) => ({
      type: e.type,
      rowNumber: e.rowNumber ?? null,
      fieldName: e.fieldName ?? null,
      fieldNumber: e.fieldNumber ?? null,
      cell: e.cell ?? null,
    })),
    resource_data: brut.resource_data,
  };
}

mkdirSync(GOLDENS, { recursive: true });

const fixtures = readdirSync(FIXTURES)
  .filter((f) => [".csv", ".xlsx"].includes(extname(f)))
  .sort();

let ok = 0;
let echecs = 0;

for (const fixture of fixtures) {
  for (const schema of SCHEMAS) {
    const cible = join(
      GOLDENS,
      `${fixture}.${schema.replace(".json", "")}.golden.json`,
    );
    try {
      const golden = await capturer(join(FIXTURES, fixture), fixture, schema);
      writeFileSync(cible, JSON.stringify(golden, null, 2) + "\n");
      const resume = golden.erreurHttp
        ? `HTTP ${golden.erreurHttp}`
        : `valid=${golden.valid} erreurs=${golden.errors.length}`;
      console.log(`OK    ${fixture} / ${schema} -> ${resume}`);
      ok += 1;
    } catch (erreur) {
      console.error(`ECHEC ${fixture} / ${schema} : ${erreur.message}`);
      echecs += 1;
    }
    await new Promise((r) => setTimeout(r, 250));
  }
}

console.log(`\n${ok} goldens captures, ${echecs} echecs.`);
if (echecs > 0) process.exitCode = 1;
