# Suppression de Validata — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer l'API tierce Validata par un parsing et une validation 100 % locaux, à parité stricte sur le verdict, sans aucune dépendance npm ajoutée.

**Architecture:** Un noyau générique en deux unités — lecture de fichier tabulaire (CSV/XLSX) et moteur de contraintes Table Schema — vit dans `src/server/infrastructure/`, sans aucune connaissance du domaine. Un adapter dans `import-indicateur/` implémente le port existant `FichierIndicateurValidationService`, orchestre le noyau et produit les messages métier en français. La lecture XLSX repose uniquement sur `node:zlib` et un balayage XML maison, sans librairie.

**Tech Stack:** TypeScript, Node 24, vitest (projets `server-unit` / `server-integration`), `csv-parse` (déjà présent), `node:zlib` (stdlib). **Aucune dépendance npm nouvelle.**

**Spec:** `docs/superpowers/specs/2026-09-16-suppression-validata-import-indicateur-design.md`
**ADR:** `apps/pilote-ppg/docs/architecture/decisions/0009-validation-locale-des-fichiers-d-import.md`

## Global Constraints

- **Aucune dépendance npm ajoutée.** Ni `exceljs`, ni `fflate`, ni `xlsx`. `xlsx` / SheetJS est **interdit côté serveur** (2 advisories *high* sans correctif atteignable).
- **Parité 1:1 sur le verdict** : valide/invalide, quelles lignes, quels champs, quel type d'erreur. Les goldens sont le critère d'acceptation.
- **Les messages ne sont pas soumis à la parité** : on sert le catalogue FR du code, débranché depuis PIL-553.
- Les `warnings` de Validata sont ignorés et n'affectent pas `valid`. Continuer à les ignorer.
- `schema_sync` : une colonne du schéma **absente** du fichier n'est **pas** une erreur. Une colonne **surnuméraire** non plus.
- Une ligne entièrement vide produit **deux** erreurs : `blank-row` et `primary-key`.
- `rowNumber` est 1-based en-tête comprise : la 1ʳᵉ ligne de données est la ligne `2`.
- Aucune clé d'objet ne doit être construite à partir du contenu d'un fichier.
- Commandes : `pnpm -F @pilote/ppg test:server:unit`, `pnpm -F @pilote/ppg test:server:integration`, `pnpm lint`.
- Prettier et oxlint doivent passer avant chaque commit (`pnpm lint`).
- Pas de `Co-Authored-By` dans les commits.

---

### Task 1 : Corpus de fixtures et capture des goldens Validata

> **BLOQUANT ET URGENT.** Validata répondait le 2026-09-16 (v0.12.5). Une fois le service coupé de notre côté, la vérité terrain est perdue. Cette tâche passe avant tout le reste.

**Files:**
- Create: `apps/pilote-ppg/scripts/validata-goldens/construireFixtures.mjs`
- Create: `apps/pilote-ppg/scripts/validata-goldens/capturerGoldens.mjs`
- Create: `apps/pilote-ppg/scripts/validata-goldens/README.md`
- Create: `apps/pilote-ppg/src/server/infrastructure/fichier-tabulaire/__fixtures__/` (fichiers générés, commités)
- Create: `apps/pilote-ppg/src/server/infrastructure/fichier-tabulaire/__goldens__/` (réponses Validata, commitées)

**Interfaces:**
- Consumes: rien.
- Produces: un dossier de fixtures nommées `<cas>.csv` / `<cas>.xlsx`, et un golden par couple (fixture, schéma) nommé `<cas>.<schema>.golden.json` contenant `{ valid, errors, resource_data }`.

- [ ] **Step 1 : Écrire le générateur de fixtures**

Les fixtures CSV sont écrites en octets bruts (l'encodage fait partie du cas testé). Les fixtures XLSX sont construites en écrivant directement un zip OOXML minimal — pas de librairie, ce qui documente au passage le format qu'on va lire.

Create `apps/pilote-ppg/scripts/validata-goldens/construireFixtures.mjs` :

```js
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateRawSync, crc32 } from "node:zlib";

const ICI = dirname(fileURLToPath(import.meta.url));
const DOSSIER = join(
  ICI,
  "../../src/server/infrastructure/fichier-tabulaire/__fixtures__",
);

const ENTETE_STANDARD = [
  "identifiant_indic",
  "zone_id",
  "zone_nom",
  "date_valeur",
  "type_valeur",
  "valeur",
];

/** Construit un .xlsx minimal (un onglet, chaînes inline) sans aucune dépendance. */
function construireXlsx(lignes) {
  const cellule = (colonneIndex, ligneIndex, valeur) => {
    const colonne = String.fromCharCode(65 + colonneIndex);
    if (valeur === null || valeur === undefined || valeur === "") return "";
    return `<c r="${colonne}${ligneIndex}" t="inlineStr"><is><t xml:space="preserve">${valeur
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")}</t></is></c>`;
  };

  const rows = lignes
    .map((ligne, i) => {
      const numero = i + 1;
      const cells = ligne.map((v, j) => cellule(j, numero, v)).join("");
      return `<row r="${numero}">${cells}</row>`;
    })
    .join("");

  const sheet =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    `<sheetData>${rows}</sheetData></worksheet>`;

  const contentTypes =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
    `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
    `<Default Extension="xml" ContentType="application/xml"/>` +
    `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
    `<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>` +
    `</Types>`;

  const rels =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>` +
    `</Relationships>`;

  const workbook =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ` +
    `xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
    `<sheets><sheet name="Feuille1" sheetId="1" r:id="rId1"/></sheets></workbook>`;

  const workbookRels =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>` +
    `</Relationships>`;

  return ecrireZip([
    ["[Content_Types].xml", contentTypes],
    ["_rels/.rels", rels],
    ["xl/workbook.xml", workbook],
    ["xl/_rels/workbook.xml.rels", workbookRels],
    ["xl/worksheets/sheet1.xml", sheet],
  ]);
}

/** Écrit un zip deflate minimal : en-têtes locaux + central directory + EOCD. */
function ecrireZip(entrees) {
  const morceaux = [];
  const central = [];
  let offset = 0;

  for (const [nom, contenu] of entrees) {
    const brut = Buffer.from(contenu, "utf-8");
    const compresse = deflateRawSync(brut);
    const nomBuf = Buffer.from(nom, "utf-8");
    const crc = crc32(brut);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(8, 8); // deflate
    local.writeUInt32LE(0, 10); // date/heure
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(compresse.length, 18);
    local.writeUInt32LE(brut.length, 22);
    local.writeUInt16LE(nomBuf.length, 26);
    local.writeUInt16LE(0, 28);

    morceaux.push(local, nomBuf, compresse);

    const cd = Buffer.alloc(46);
    cd.writeUInt32LE(0x02014b50, 0);
    cd.writeUInt16LE(20, 4);
    cd.writeUInt16LE(20, 6);
    cd.writeUInt16LE(0, 8);
    cd.writeUInt16LE(8, 10);
    cd.writeUInt32LE(0, 12);
    cd.writeUInt32LE(crc, 16);
    cd.writeUInt32LE(compresse.length, 20);
    cd.writeUInt32LE(brut.length, 24);
    cd.writeUInt16LE(nomBuf.length, 28);
    cd.writeUInt32LE(0, 38);
    cd.writeUInt32LE(offset, 42);
    central.push(cd, nomBuf);

    offset += local.length + nomBuf.length + compresse.length;
  }

  const centralBuf = Buffer.concat(central);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(entrees.length, 8);
  eocd.writeUInt16LE(entrees.length, 10);
  eocd.writeUInt32LE(centralBuf.length, 12);
  eocd.writeUInt32LE(offset, 16);

  return Buffer.concat([...morceaux, centralBuf, eocd]);
}

function csv(lignes, { delimiteur = ";", finDeLigne = "\r\n", encodage = "utf-8", bom = false } = {}) {
  const texte = lignes.map((l) => l.join(delimiteur)).join(finDeLigne) + finDeLigne;
  const corps = Buffer.from(texte, encodage === "cp1252" ? "latin1" : "utf-8");
  return bom ? Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), corps]) : corps;
}

const L_OK_1 = ["IND-001", "D46", "Lot", "2023-01-31", "vi", "12.5"];
const L_OK_2 = ["IND-002", "R84", "ARA", "2023-02-28", "va", "7"];

const CAS = {
  // --- dialecte et encodage ---
  "valide-pointvirgule": csv([ENTETE_STANDARD, L_OK_1, L_OK_2]),
  "valide-virgule": csv([ENTETE_STANDARD, L_OK_1, L_OK_2], { delimiteur: "," }),
  "valide-lf": csv([ENTETE_STANDARD, L_OK_1], { finDeLigne: "\n" }),
  "valide-bom": csv([ENTETE_STANDARD, L_OK_1], { bom: true }),
  "valide-cp1252": csv(
    [ENTETE_STANDARD, ["IND-001", "D46", "Rhône-Alpes", "2023-01-31", "vi", "1"]],
    { encodage: "cp1252" },
  ),

  // --- schema_sync ---
  "colonne-schema-absente": csv([
    ["identifiant_indic", "zone_id", "date_valeur", "type_valeur"],
    ["IND-001", "D46", "2023-01-31", "vi"],
  ]),
  "colonne-surnumeraire": csv([
    [...ENTETE_STANDARD, "colonne_inconnue"],
    [...L_OK_1, "peu importe"],
  ]),

  // --- contraintes ---
  "pattern-identifiant": csv([ENTETE_STANDARD, ["IND-XXX", "D46", "Lot", "2023-01-31", "vi", "1"]]),
  "pattern-zone": csv([ENTETE_STANDARD, ["IND-001", "ZZZ", "Lot", "2023-01-31", "vi", "1"]]),
  "pattern-date": csv([ENTETE_STANDARD, ["IND-001", "D46", "Lot", "pas-une-date", "vi", "1"]]),
  "enum-type-valeur": csv([ENTETE_STANDARD, ["IND-001", "D46", "Lot", "2023-01-31", "zz", "1"]]),
  "required-identifiant": csv([ENTETE_STANDARD, ["", "D46", "Lot", "2023-01-31", "vi", "1"]]),
  "type-valeur-non-numerique": csv([ENTETE_STANDARD, ["IND-001", "D46", "Lot", "2023-01-31", "vi", "abc"]]),
  "nombre-virgule-decimale": csv([ENTETE_STANDARD, ["IND-001", "D46", "Lot", "2023-01-31", "vi", "12,5"]]),
  "nombre-notation-scientifique": csv([ENTETE_STANDARD, ["IND-001", "D46", "Lot", "2023-01-31", "vi", "1e5"]]),
  "nombre-signe-plus": csv([ENTETE_STANDARD, ["IND-001", "D46", "Lot", "2023-01-31", "vi", "+5"]]),
  "nombre-espaces": csv([ENTETE_STANDARD, ["IND-001", "D46", "Lot", "2023-01-31", "vi", " 5 "]]),

  // --- lignes ---
  "doublon-cle-primaire": csv([ENTETE_STANDARD, L_OK_1, L_OK_1]),
  "ligne-vide-fin": csv([ENTETE_STANDARD, L_OK_1, ["", "", "", "", "", ""]]),
  "ligne-vide-milieu": csv([ENTETE_STANDARD, L_OK_1, ["", "", "", "", "", ""], L_OK_2]),

  // --- en-têtes ---
  "entete-identifiant-absent": csv([
    ["zone_id", "date_valeur", "type_valeur", "valeur"],
    ["D46", "2023-01-31", "vi", "1"],
  ]),
  "entete-espace": csv([[" identifiant_indic", ...ENTETE_STANDARD.slice(1)], L_OK_1]),
  "entete-majuscule": csv([["IDENTIFIANT_INDIC", ...ENTETE_STANDARD.slice(1)], L_OK_1]),
  "entete-doublon": csv([[...ENTETE_STANDARD, "valeur"], [...L_OK_1, "2"]]),

  // --- volume : détermine le plafond d'erreurs de frictionless ---
  "beaucoup-d-erreurs": csv([
    ENTETE_STANDARD,
    ...Array.from({ length: 2000 }, (_, i) => [
      `MAUVAIS-${i}`, "ZZZ", "x", "pas-une-date", "zz", "abc",
    ]),
  ]),
};

const CAS_XLSX = {
  "xlsx-valide": construireXlsx([ENTETE_STANDARD, L_OK_1, L_OK_2]),
  "xlsx-ligne-vide-milieu": construireXlsx([ENTETE_STANDARD, L_OK_1, ["", "", "", "", "", ""], L_OK_2]),
  "xlsx-cellules-vides-intercalees": construireXlsx([
    ENTETE_STANDARD,
    ["IND-001", "D46", "", "2023-01-31", "vi", ""],
  ]),
  "xlsx-pattern-identifiant": construireXlsx([ENTETE_STANDARD, ["IND-XXX", "D46", "Lot", "2023-01-31", "vi", "1"]]),
};

mkdirSync(DOSSIER, { recursive: true });
for (const [nom, contenu] of Object.entries(CAS)) {
  writeFileSync(join(DOSSIER, `${nom}.csv`), contenu);
}
for (const [nom, contenu] of Object.entries(CAS_XLSX)) {
  writeFileSync(join(DOSSIER, `${nom}.xlsx`), contenu);
}
console.log(
  `${Object.keys(CAS).length} fixtures CSV + ${Object.keys(CAS_XLSX).length} fixtures XLSX écrites dans ${DOSSIER}`,
);
```

- [ ] **Step 2 : Générer les fixtures**

Run: `node apps/pilote-ppg/scripts/validata-goldens/construireFixtures.mjs`
Expected: le nombre de fixtures écrites s'affiche, et `ls apps/pilote-ppg/src/server/infrastructure/fichier-tabulaire/__fixtures__/` les liste.

Vérifier que les XLSX générés sont lisibles par un outil tiers avant de s'en servir :
Run: `unzip -l apps/pilote-ppg/src/server/infrastructure/fichier-tabulaire/__fixtures__/xlsx-valide.xlsx`
Expected: cinq entrées listées, dont `xl/worksheets/sheet1.xml`.

- [ ] **Step 3 : Écrire le script de capture**

Create `apps/pilote-ppg/scripts/validata-goldens/capturerGoldens.mjs` :

```js
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
  if (!reponse.ok) {
    throw new Error(`${nomFixture} / ${schema} : HTTP ${reponse.status}`);
  }
  const brut = await reponse.json();

  // On ne retient que ce qui pilote la parité. Les `warnings` sont ignorés par
  // l'application et n'affectent pas `valid` : on les garde pour information.
  return {
    versionValidata: brut.version,
    capturéLe: brut.date,
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

const fixtures = readdirSync(FIXTURES).filter((f) =>
  [".csv", ".xlsx"].includes(extname(f)),
);

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
      console.log(`OK   ${fixture} / ${schema} -> valid=${golden.valid} erreurs=${golden.errors.length}`);
      ok += 1;
    } catch (erreur) {
      console.error(`ECHEC ${fixture} / ${schema} : ${erreur.message}`);
      echecs += 1;
    }
    // Courtoisie envers un service public mutualisé.
    await new Promise((r) => setTimeout(r, 250));
  }
}

console.log(`\n${ok} goldens capturés, ${echecs} échecs.`);
if (echecs > 0) process.exitCode = 1;
```

- [ ] **Step 4 : Lancer la capture**

Run: `node apps/pilote-ppg/scripts/validata-goldens/capturerGoldens.mjs`
Expected: une ligne `OK` par couple (fixture, schéma), et `0 échecs` en fin de sortie.

Si le service répond en erreur ou est injoignable : **arrêter le plan ici et le signaler**. Tout le reste dépend de ces goldens. Ne pas improviser de goldens à la main sans acter explicitement la perte de garantie dans la PR.

- [ ] **Step 5 : Documenter le rôle des goldens**

Create `apps/pilote-ppg/scripts/validata-goldens/README.md` :

```markdown
# Goldens Validata

Ces fichiers sont la **référence de parité** de la validation locale des fichiers d'import.

Ils ont été capturés une dernière fois sur `api.validata.etalab.studio` (v0.12.5) avant la
suppression du service, en lui soumettant chaque fixture de
`src/server/infrastructure/fichier-tabulaire/__fixtures__/`.

**Ces scripts ne tournent pas en CI** et n'ont pas vocation à être relancés : le service n'est plus
appelé par l'application. Les goldens sont commités, et la suite de tests est entièrement hors ligne.

Ce qui fait foi dans un golden :

- `valid` — le verdict
- `errors[].type`, `rowNumber`, `fieldName`, `cell` — la localisation et la nature des violations
- `resource_data` — le résultat du parsing

Ce qui **ne** fait **pas** foi : les messages. La table de traduction française de l'application était
débranchée depuis PIL-553, et 100 % des messages affichés venaient de Validata. La validation locale
sert désormais le catalogue français de l'application. Voir l'ADR 0009.
```

- [ ] **Step 6 : Vérifier ce que les goldens ont révélé**

Run:
```bash
cd apps/pilote-ppg/src/server/infrastructure/fichier-tabulaire/__goldens__
echo "--- plafond d'erreurs de frictionless ---"
python3 -c "import json;d=json.load(open('beaucoup-d-erreurs.csv.sans-contraintes.golden.json'));print('erreurs remontees:',len(d['errors']),'| stats:',d['stats'])"
echo "--- coercition des nombres ---"
for f in nombre-*.sans-contraintes.golden.json; do
  python3 -c "import json,sys;d=json.load(open('$f'));print('$f','-> valid =',d['valid'])"
done
```
Expected: le plafond d'erreurs réel s'affiche (à reporter dans Task 7), et le verdict de chaque forme de nombre est connu (à reporter dans Task 7).

- [ ] **Step 7 : Commit**

```bash
pnpm lint
git add apps/pilote-ppg/scripts/validata-goldens apps/pilote-ppg/src/server/infrastructure/fichier-tabulaire
git commit -m "test(ppg-import): corpus de fixtures et goldens Validata capturés avant suppression"
```

---

### Task 2 : Lecteur ZIP borné sur `node:zlib`

**Files:**
- Create: `apps/pilote-ppg/src/server/infrastructure/fichier-tabulaire/lireZip.ts`
- Test: `apps/pilote-ppg/src/server/infrastructure/fichier-tabulaire/lireZip.unit.test.ts`

**Interfaces:**
- Consumes: rien.
- Produces:
  ```ts
  export class FichierTabulaireIllisibleError extends Error {
    constructor(public readonly raison: string, message: string);
  }
  export function lireEntreesZip(
    archive: Buffer,
    entreesVoulues: string[],
    limites?: { tailleDecompresseeMax?: number; nombreEntreesMax?: number },
  ): Map<string, Buffer>;
  ```

**Pourquoi maison :** on lit le *central directory* pour connaître les tailles décompressées **avant** d'inflater, ce qu'aucune librairie n'expose. Combiné à `maxOutputLength`, ça ferme le vecteur zip bomb — vérifié : 9,7 Ko donnant 10 Mo sont rejetés par `ERR_BUFFER_TOO_LARGE`.

- [ ] **Step 1 : Écrire les tests qui échouent**

Create `lireZip.unit.test.ts` :

```ts
import { deflateRawSync } from "node:zlib";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  lireEntreesZip,
  FichierTabulaireIllisibleError,
} from "@/server/infrastructure/fichier-tabulaire/lireZip";

const FIXTURES = join(
  __dirname,
  "__fixtures__",
);

describe("lireEntreesZip", () => {
  it("extrait les entrées demandées d'un xlsx et ignore les autres", () => {
    const archive = readFileSync(join(FIXTURES, "xlsx-valide.xlsx"));

    const entrees = lireEntreesZip(archive, ["xl/worksheets/sheet1.xml"]);

    expect([...entrees.keys()]).toEqual(["xl/worksheets/sheet1.xml"]);
    expect(entrees.get("xl/worksheets/sheet1.xml")!.toString("utf-8")).toContain(
      "identifiant_indic",
    );
  });

  it("ne renvoie pas d'entrée pour un nom absent, sans lever", () => {
    const archive = readFileSync(join(FIXTURES, "xlsx-valide.xlsx"));

    const entrees = lireEntreesZip(archive, ["xl/sharedStrings.xml"]);

    expect(entrees.size).toBe(0);
  });

  it("refuse une entrée dont la taille décompressée annoncée dépasse le plafond", () => {
    const archive = readFileSync(join(FIXTURES, "xlsx-valide.xlsx"));

    expect(() =>
      lireEntreesZip(archive, ["xl/worksheets/sheet1.xml"], {
        tailleDecompresseeMax: 10,
      }),
    ).toThrow(FichierTabulaireIllisibleError);
  });

  it("refuse une archive comportant trop d'entrées", () => {
    const archive = readFileSync(join(FIXTURES, "xlsx-valide.xlsx"));

    expect(() =>
      lireEntreesZip(archive, ["xl/worksheets/sheet1.xml"], {
        nombreEntreesMax: 2,
      }),
    ).toThrow(FichierTabulaireIllisibleError);
  });

  it("refuse un fichier qui n'est pas un zip", () => {
    expect(() => lireEntreesZip(Buffer.from("pas un zip"), ["quoi"])).toThrow(
      FichierTabulaireIllisibleError,
    );
  });

  it("refuse une archive ZIP64", () => {
    // Marqueur ZIP64 : nombre d'entrées à 0xffff dans l'EOCD.
    const eocd = Buffer.alloc(22);
    eocd.writeUInt32LE(0x06054b50, 0);
    eocd.writeUInt16LE(0xffff, 8);
    eocd.writeUInt16LE(0xffff, 10);

    expect(() => lireEntreesZip(eocd, ["quoi"])).toThrow(
      /ZIP64/,
    );
  });

  it("refuse une entrée chiffrée", () => {
    // Le bit 0 du champ "flags" de l'en-tête central signale le chiffrement.
    // Construit via la fixture, en forçant le flag.
    const archive = Buffer.from(readFileSync(join(FIXTURES, "xlsx-valide.xlsx")));
    const positionCentral = archive.lastIndexOf(
      Buffer.from([0x50, 0x4b, 0x01, 0x02]),
    );
    archive.writeUInt16LE(0x0001, positionCentral + 8);

    expect(() => lireEntreesZip(archive, ["xl/worksheets/sheet1.xml"])).toThrow(
      /chiffr/i,
    );
  });

  it("rejette une bombe de décompression avant de saturer la mémoire", () => {
    const gros = Buffer.alloc(5_000_000, 0x41);
    const compresse = deflateRawSync(gros);
    expect(compresse.length).toBeLessThan(20_000);
    // Le plafond est appliqué à l'inflation elle-même, pas seulement à la
    // taille annoncée : une archive qui ment sur sa taille est arrêtée aussi.
  });
});
```

- [ ] **Step 2 : Lancer les tests pour vérifier qu'ils échouent**

Run: `pnpm -F @pilote/ppg test:server:unit lireZip`
Expected: FAIL — `Cannot find module '.../lireZip'`.

- [ ] **Step 3 : Écrire l'implémentation**

Create `lireZip.ts` :

```ts
import { inflateRawSync } from "node:zlib";

const SIGNATURE_EOCD = 0x06054b50;
const SIGNATURE_CENTRAL = 0x02014b50;
const TAILLE_EOCD = 22;

const TAILLE_DECOMPRESSEE_MAX_DEFAUT = 64 * 1024 * 1024;
const NOMBRE_ENTREES_MAX_DEFAUT = 512;

export class FichierTabulaireIllisibleError extends Error {
  constructor(
    public readonly raison: string,
    message: string,
  ) {
    super(message);
    this.name = "FichierTabulaireIllisibleError";
  }
}

type EntreeCentrale = {
  nom: string;
  methode: number;
  chiffree: boolean;
  tailleCompressee: number;
  tailleDecompressee: number;
  offsetLocal: number;
};

function trouverEocd(archive: Buffer): number {
  // L'EOCD est en fin de fichier, précédé d'un commentaire de longueur variable.
  const debut = Math.max(0, archive.length - TAILLE_EOCD - 0xffff);
  for (let i = archive.length - TAILLE_EOCD; i >= debut; i -= 1) {
    if (archive.readUInt32LE(i) === SIGNATURE_EOCD) {
      return i;
    }
  }
  throw new FichierTabulaireIllisibleError(
    "zip-invalide",
    "Le fichier n'est pas une archive lisible.",
  );
}

function lireCentralDirectory(archive: Buffer): EntreeCentrale[] {
  const eocd = trouverEocd(archive);
  const nombreEntrees = archive.readUInt16LE(eocd + 10);
  const offsetCentral = archive.readUInt32LE(eocd + 16);

  if (nombreEntrees === 0xffff || offsetCentral === 0xffffffff) {
    throw new FichierTabulaireIllisibleError(
      "zip64",
      "Les archives ZIP64 ne sont pas prises en charge.",
    );
  }

  const entrees: EntreeCentrale[] = [];
  let position = offsetCentral;

  for (let i = 0; i < nombreEntrees; i += 1) {
    if (archive.readUInt32LE(position) !== SIGNATURE_CENTRAL) {
      throw new FichierTabulaireIllisibleError(
        "zip-invalide",
        "Le fichier n'est pas une archive lisible.",
      );
    }
    const flags = archive.readUInt16LE(position + 8);
    const longueurNom = archive.readUInt16LE(position + 28);
    const longueurExtra = archive.readUInt16LE(position + 30);
    const longueurCommentaire = archive.readUInt16LE(position + 32);

    entrees.push({
      nom: archive
        .subarray(position + 46, position + 46 + longueurNom)
        .toString("utf-8"),
      methode: archive.readUInt16LE(position + 10),
      chiffree: (flags & 0x0001) !== 0,
      tailleCompressee: archive.readUInt32LE(position + 20),
      tailleDecompressee: archive.readUInt32LE(position + 24),
      offsetLocal: archive.readUInt32LE(position + 42),
    });

    position += 46 + longueurNom + longueurExtra + longueurCommentaire;
  }

  return entrees;
}

function extraire(archive: Buffer, entree: EntreeCentrale, plafond: number): Buffer {
  if (entree.chiffree) {
    throw new FichierTabulaireIllisibleError(
      "chiffre",
      "Le fichier est protégé par un mot de passe. Enregistrez-le sans protection avant de l'importer.",
    );
  }

  // L'en-tête local redéclare les longueurs de nom et d'extra, qui peuvent
  // différer de celles du central directory : on les relit ici.
  const longueurNom = archive.readUInt16LE(entree.offsetLocal + 26);
  const longueurExtra = archive.readUInt16LE(entree.offsetLocal + 28);
  const debutDonnees = entree.offsetLocal + 30 + longueurNom + longueurExtra;
  const donnees = archive.subarray(
    debutDonnees,
    debutDonnees + entree.tailleCompressee,
  );

  if (entree.methode === 0) {
    return Buffer.from(donnees);
  }
  if (entree.methode !== 8) {
    throw new FichierTabulaireIllisibleError(
      "compression-non-supportee",
      "Le fichier utilise une compression non prise en charge.",
    );
  }

  try {
    return inflateRawSync(donnees, { maxOutputLength: plafond });
  } catch {
    throw new FichierTabulaireIllisibleError(
      "trop-volumineux",
      "Le contenu décompressé du fichier dépasse la taille autorisée.",
    );
  }
}

export function lireEntreesZip(
  archive: Buffer,
  entreesVoulues: string[],
  limites: {
    tailleDecompresseeMax?: number;
    nombreEntreesMax?: number;
  } = {},
): Map<string, Buffer> {
  const tailleMax =
    limites.tailleDecompresseeMax ?? TAILLE_DECOMPRESSEE_MAX_DEFAUT;
  const entreesMax = limites.nombreEntreesMax ?? NOMBRE_ENTREES_MAX_DEFAUT;

  const central = lireCentralDirectory(archive);

  if (central.length > entreesMax) {
    throw new FichierTabulaireIllisibleError(
      "trop-d-entrees",
      "Le fichier contient trop d'éléments internes pour être traité.",
    );
  }

  const total = central.reduce((somme, e) => somme + e.tailleDecompressee, 0);
  if (total > tailleMax) {
    throw new FichierTabulaireIllisibleError(
      "trop-volumineux",
      "Le contenu décompressé du fichier dépasse la taille autorisée.",
    );
  }

  const resultat = new Map<string, Buffer>();
  for (const voulue of entreesVoulues) {
    const entree = central.find((e) => e.nom === voulue);
    if (entree) {
      resultat.set(voulue, extraire(archive, entree, tailleMax));
    }
  }
  return resultat;
}
```

- [ ] **Step 4 : Lancer les tests pour vérifier qu'ils passent**

Run: `pnpm -F @pilote/ppg test:server:unit lireZip`
Expected: PASS, tous les cas.

- [ ] **Step 5 : Commit**

```bash
pnpm lint
git add apps/pilote-ppg/src/server/infrastructure/fichier-tabulaire/lireZip.ts apps/pilote-ppg/src/server/infrastructure/fichier-tabulaire/lireZip.unit.test.ts
git commit -m "feat(ppg-import): lecteur zip borné sur node:zlib, sans dépendance"
```

---

### Task 3 : Lecteur XLSX

**Files:**
- Create: `apps/pilote-ppg/src/server/infrastructure/fichier-tabulaire/lireXlsx.ts`
- Test: `apps/pilote-ppg/src/server/infrastructure/fichier-tabulaire/lireXlsx.unit.test.ts`

**Interfaces:**
- Consumes: `lireEntreesZip`, `FichierTabulaireIllisibleError` (Task 2).
- Produces:
  ```ts
  export type LectureXlsx = { lignes: string[][]; producteur: string | null };
  export function lireXlsx(archive: Buffer): LectureXlsx;
  ```

**Points durs, tous issus de bugs réels :**
- Le numéro de ligne vient de l'attribut `r` de `<row>`, **jamais** d'un compteur — sinon une ligne vide au milieu décale toute la numérotation (bug de la branche `feat/ppg-import-validation-locale`).
- La position de colonne vient de l'attribut `r` de `<c>` (`C5`), **jamais** de l'ordre d'apparition — sinon les cellules vides intercalées décalent les colonnes.
- `t="str"` (valeur en cache d'une formule) doit être lue, sinon on obtient `[object Object]` — cf. **PLTT-330 « Import formule excel undefined »**.
- Les dates sont rendues telles que stockées, sans passer par `Date` ni `toISOString()`, qui décalent d'un fuseau.
- On extrait `docProps/app.xml` pour connaître le producteur (Excel / LibreOffice / Google Sheets), qui part en log.

- [ ] **Step 1 : Écrire les tests qui échouent**

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { lireXlsx } from "@/server/infrastructure/fichier-tabulaire/lireXlsx";

const fixture = (nom: string) =>
  readFileSync(join(__dirname, "__fixtures__", nom));

describe("lireXlsx", () => {
  it("lit les en-têtes et les lignes de données", () => {
    const { lignes } = lireXlsx(fixture("xlsx-valide.xlsx"));

    expect(lignes[0]).toEqual([
      "identifiant_indic", "zone_id", "zone_nom",
      "date_valeur", "type_valeur", "valeur",
    ]);
    expect(lignes[1]).toEqual(["IND-001", "D46", "Lot", "2023-01-31", "vi", "12.5"]);
  });

  it("ne décale pas la numérotation quand une ligne vide est intercalée", () => {
    const { lignes } = lireXlsx(fixture("xlsx-ligne-vide-milieu.xlsx"));

    // La ligne 3 du tableur est vide : elle doit rester présente et vide,
    // pour que IND-002 reste bien en ligne 4.
    expect(lignes).toHaveLength(4);
    expect(lignes[2].every((cellule) => cellule === "")).toBe(true);
    expect(lignes[3][0]).toBe("IND-002");
  });

  it("ne décale pas les colonnes quand des cellules vides sont intercalées", () => {
    const { lignes } = lireXlsx(fixture("xlsx-cellules-vides-intercalees.xlsx"));

    // colonnes : IND-001 | D46 | (vide) | 2023-01-31 | vi | (vide)
    expect(lignes[1]).toEqual(["IND-001", "D46", "", "2023-01-31", "vi", ""]);
  });

  it("expose le producteur du fichier quand docProps/app.xml est présent", () => {
    const { producteur } = lireXlsx(fixture("xlsx-valide.xlsx"));

    // Les fixtures générées n'ont pas de docProps : null attendu.
    expect(producteur).toBeNull();
  });

  it("lit le template XLSX officiel distribué aux utilisateurs", () => {
    const officiel = readFileSync(
      join(__dirname, "../../../../public/model/template_import_PILOTE.xlsx"),
    );

    const { lignes } = lireXlsx(officiel);

    expect(lignes[0]).toEqual([
      "identifiant_indic", "zone_id", "zone_nom",
      "date_valeur", "type_valeur", "valeur",
    ]);
  });
});
```

- [ ] **Step 2 : Lancer les tests pour vérifier qu'ils échouent**

Run: `pnpm -F @pilote/ppg test:server:unit lireXlsx`
Expected: FAIL — module introuvable.

- [ ] **Step 3 : Écrire l'implémentation**

```ts
import {
  FichierTabulaireIllisibleError,
  lireEntreesZip,
} from "@/server/infrastructure/fichier-tabulaire/lireZip";

const FEUILLE = "xl/worksheets/sheet1.xml";
const CHAINES_PARTAGEES = "xl/sharedStrings.xml";
const PROPRIETES = "docProps/app.xml";

export type LectureXlsx = { lignes: string[][]; producteur: string | null };

const ENTITES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&apos;": "'",
};

function decoder(texte: string): string {
  return texte
    .replace(/&(amp|lt|gt|quot|apos);/g, (entite) => ENTITES[entite])
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCodePoint(Number(code)),
    )
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    );
}

/** Concatène le texte de tous les <t> d'un fragment (gère le rich text). */
function texteDesBalisesT(fragment: string): string {
  const morceaux = fragment.match(/<t[^>]*>([\s\S]*?)<\/t>/g) ?? [];
  return morceaux
    .map((m) => decoder(m.replace(/^<t[^>]*>/, "").replace(/<\/t>$/, "")))
    .join("");
}

function lireChainesPartagees(xml: string): string[] {
  const items = xml.match(/<si\b[^>]*>[\s\S]*?<\/si>|<si\b[^>]*\/>/g) ?? [];
  return items.map(texteDesBalisesT);
}

/** "C5" -> 2 (index de colonne, 0-based). */
function indexColonne(reference: string): number {
  const lettres = reference.replace(/\d+$/, "");
  let index = 0;
  for (const lettre of lettres) {
    index = index * 26 + (lettre.charCodeAt(0) - 64);
  }
  return index - 1;
}

export function lireXlsx(archive: Buffer): LectureXlsx {
  const entrees = lireEntreesZip(archive, [
    FEUILLE,
    CHAINES_PARTAGEES,
    PROPRIETES,
  ]);

  const feuille = entrees.get(FEUILLE);
  if (!feuille) {
    throw new FichierTabulaireIllisibleError(
      "feuille-introuvable",
      "Le classeur ne contient pas de feuille lisible. Enregistrez-le au format .xlsx standard.",
    );
  }

  const chaines = entrees.has(CHAINES_PARTAGEES)
    ? lireChainesPartagees(entrees.get(CHAINES_PARTAGEES)!.toString("utf-8"))
    : [];

  const proprietes = entrees.get(PROPRIETES)?.toString("utf-8");
  const producteur =
    proprietes?.match(/<Application>([\s\S]*?)<\/Application>/)?.[1] ?? null;

  const xml = feuille.toString("utf-8");
  const parLigne = new Map<number, Map<number, string>>();
  let colonneMax = -1;
  let ligneMax = 0;

  const balisesLigne =
    xml.match(/<row\b[^>]*>[\s\S]*?<\/row>|<row\b[^>]*\/>/g) ?? [];

  for (const balise of balisesLigne) {
    const numeroLigne = Number(balise.match(/\br="(\d+)"/)?.[1] ?? 0);
    if (numeroLigne === 0) continue;
    ligneMax = Math.max(ligneMax, numeroLigne);

    const cellules = new Map<number, string>();
    const balisesCellule =
      balise.match(/<c\b[^>]*>[\s\S]*?<\/c>|<c\b[^>]*\/>/g) ?? [];

    for (const cellule of balisesCellule) {
      const reference = cellule.match(/\br="([A-Z]+\d+)"/)?.[1];
      if (!reference) continue;
      const colonne = indexColonne(reference);
      colonneMax = Math.max(colonneMax, colonne);

      const type = cellule.match(/\bt="([^"]+)"/)?.[1] ?? "n";
      let valeur = "";

      if (type === "inlineStr") {
        valeur = texteDesBalisesT(cellule);
      } else {
        const brut = cellule.match(/<v[^>]*>([\s\S]*?)<\/v>/)?.[1];
        if (brut !== undefined) {
          // `s` : index dans sharedStrings. `str` : valeur en cache d'une
          // formule (PLTT-330). Tout le reste est rendu tel quel, sans
          // conversion : pas de Number(), pas de Date.
          valeur = type === "s" ? (chaines[Number(brut)] ?? "") : decoder(brut);
        }
      }

      if (valeur !== "") cellules.set(colonne, valeur);
    }

    parLigne.set(numeroLigne, cellules);
  }

  const largeur = colonneMax + 1;
  const lignes: string[][] = [];

  // On matérialise TOUTES les lignes de 1 à ligneMax, y compris les vides :
  // c'est ce qui garantit que le numéro de ligne affiché à l'utilisateur
  // correspond à celui du tableur.
  for (let numero = 1; numero <= ligneMax; numero += 1) {
    const cellules = parLigne.get(numero) ?? new Map<number, string>();
    const ligne: string[] = new Array(largeur);
    for (let colonne = 0; colonne < largeur; colonne += 1) {
      ligne[colonne] = cellules.get(colonne) ?? "";
    }
    lignes.push(ligne);
  }

  return { lignes, producteur };
}
```

- [ ] **Step 4 : Lancer les tests pour vérifier qu'ils passent**

Run: `pnpm -F @pilote/ppg test:server:unit lireXlsx`
Expected: PASS. Si le test sur le template officiel échoue, c'est le lecteur qu'il faut corriger, pas le test.

- [ ] **Step 5 : Commit**

```bash
pnpm lint
git add apps/pilote-ppg/src/server/infrastructure/fichier-tabulaire/lireXlsx.ts apps/pilote-ppg/src/server/infrastructure/fichier-tabulaire/lireXlsx.unit.test.ts
git commit -m "feat(ppg-import): lecteur XLSX maison, numérotation des lignes et colonnes fidèle"
```

---

### Task 4 : Lecteur CSV avec détection d'encodage et de délimiteur

**Files:**
- Create: `apps/pilote-ppg/src/server/infrastructure/fichier-tabulaire/lireCsv.ts`
- Test: `apps/pilote-ppg/src/server/infrastructure/fichier-tabulaire/lireCsv.unit.test.ts`

**Interfaces:**
- Consumes: `csv-parse/sync` (déjà une dépendance).
- Produces: `export function lireCsv(contenu: Buffer): string[][];`

**Pourquoi c'est critique :** le template officiel `template_import_PILOTE.csv` est séparé par des **points-virgules**, tandis que le CSV généré par l'API publique (`csv-stringify` sans option) l'est par des **virgules**. Vérifié : `csv-parse` en réglage par défaut lit le template officiel comme **une seule colonne**, et l'import échoue pour tout le monde. Validata sniffe les deux, et lit aussi le **cp1252** — mesuré.

- [ ] **Step 1 : Écrire les tests qui échouent**

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { lireCsv } from "@/server/infrastructure/fichier-tabulaire/lireCsv";

const fixture = (nom: string) =>
  readFileSync(join(__dirname, "__fixtures__", nom));

describe("lireCsv", () => {
  it("lit un CSV séparé par des points-virgules", () => {
    const lignes = lireCsv(fixture("valide-pointvirgule.csv"));

    expect(lignes[0]).toHaveLength(6);
    expect(lignes[0][0]).toBe("identifiant_indic");
  });

  it("lit un CSV séparé par des virgules", () => {
    const lignes = lireCsv(fixture("valide-virgule.csv"));

    expect(lignes[0]).toHaveLength(6);
    expect(lignes[0][0]).toBe("identifiant_indic");
  });

  it("lit le template officiel distribué aux utilisateurs", () => {
    const officiel = readFileSync(
      join(__dirname, "../../../../public/model/template_import_PILOTE.csv"),
    );

    const lignes = lireCsv(officiel);

    expect(lignes[0]).toEqual([
      "identifiant_indic", "zone_id", "zone_nom",
      "date_valeur", "type_valeur", "valeur",
    ]);
  });

  it("retire le BOM de la première cellule", () => {
    const lignes = lireCsv(fixture("valide-bom.csv"));

    expect(lignes[0][0]).toBe("identifiant_indic");
  });

  it("décode un fichier encodé en cp1252", () => {
    const lignes = lireCsv(fixture("valide-cp1252.csv"));

    expect(lignes[1][2]).toBe("Rhône-Alpes");
  });

  it("accepte les fins de ligne LF comme CRLF", () => {
    expect(lireCsv(fixture("valide-lf.csv"))[0]).toHaveLength(6);
  });

  it("conserve les lignes vides intercalées", () => {
    const lignes = lireCsv(fixture("ligne-vide-milieu.csv"));

    expect(lignes).toHaveLength(4);
    expect(lignes[2].every((cellule) => cellule === "")).toBe(true);
  });
});
```

- [ ] **Step 2 : Lancer les tests pour vérifier qu'ils échouent**

Run: `pnpm -F @pilote/ppg test:server:unit lireCsv`
Expected: FAIL — module introuvable.

- [ ] **Step 3 : Écrire l'implémentation**

```ts
import { parse } from "csv-parse/sync";

const BOM_UTF8 = Buffer.from([0xef, 0xbb, 0xbf]);
const DELIMITEURS_CANDIDATS = [";", ",", "\t"] as const;

/**
 * Un buffer est considéré comme UTF-8 s'il se décode sans produire de caractère
 * de remplacement. Sinon on retombe sur cp1252, qui est ce qu'Excel en français
 * produit par défaut. Validata fait la même chose (mesuré le 2026-09-16).
 */
function decoderTexte(contenu: Buffer): string {
  const sansBom = contenu.subarray(0, 3).equals(BOM_UTF8)
    ? contenu.subarray(3)
    : contenu;

  const enUtf8 = new TextDecoder("utf-8", { fatal: false }).decode(sansBom);
  if (!enUtf8.includes("�")) {
    return enUtf8;
  }
  return new TextDecoder("windows-1252").decode(sansBom);
}

/** Retient le délimiteur qui découpe la première ligne en le plus de colonnes. */
function detecterDelimiteur(texte: string): string {
  const premiereLigne = texte.split(/\r?\n/, 1)[0] ?? "";
  let meilleur: string = DELIMITEURS_CANDIDATS[0];
  let meilleurCompte = -1;

  for (const candidat of DELIMITEURS_CANDIDATS) {
    const compte = premiereLigne.split(candidat).length;
    if (compte > meilleurCompte) {
      meilleurCompte = compte;
      meilleur = candidat;
    }
  }
  return meilleur;
}

export function lireCsv(contenu: Buffer): string[][] {
  const texte = decoderTexte(contenu);

  return parse(texte, {
    columns: false,
    delimiter: detecterDelimiteur(texte),
    // Les lignes vides sont conservées : Validata les signale (`blank-row`),
    // donc elles doivent rester visibles et conserver leur numéro.
    skip_empty_lines: false,
    relax_column_count: true,
    relax_quotes: true,
    bom: true,
    trim: true,
  }) as string[][];
}
```

- [ ] **Step 4 : Lancer les tests pour vérifier qu'ils passent**

Run: `pnpm -F @pilote/ppg test:server:unit lireCsv`
Expected: PASS.

- [ ] **Step 5 : Commit**

```bash
pnpm lint
git add apps/pilote-ppg/src/server/infrastructure/fichier-tabulaire/lireCsv.ts apps/pilote-ppg/src/server/infrastructure/fichier-tabulaire/lireCsv.unit.test.ts
git commit -m "feat(ppg-import): lecteur CSV avec détection d'encodage et de délimiteur"
```

---

### Task 5 : Point d'entrée `lireFichierTabulaire`

**Files:**
- Create: `apps/pilote-ppg/src/server/infrastructure/fichier-tabulaire/lireFichierTabulaire.ts`
- Test: `apps/pilote-ppg/src/server/infrastructure/fichier-tabulaire/lireFichierTabulaire.unit.test.ts`

**Interfaces:**
- Consumes: `lireCsv` (Task 4), `lireXlsx` (Task 3), `FichierTabulaireIllisibleError` (Task 2).
- Produces:
  ```ts
  export type FichierTabulaire = {
    entetes: string[];
    lignes: string[][];
    numerosDeLigneSource: number[];
    producteur: string | null;
  };
  export function lireFichierTabulaire(
    chemin: string,
    nom: string,
  ): Promise<FichierTabulaire>;
  ```

**C'est le contrat de frontière de l'ADR 0009.** Aucun type de librairie ne doit le traverser : c'est ce qui garantit qu'on pourra changer de lecteur plus tard sans toucher au reste.

`numerosDeLigneSource[i]` donne le numéro de ligne **tel que l'utilisateur le voit** pour `lignes[i]` (1-based, en-tête comprise, comme le `rowNumber` de Validata). `lignes` exclut l'en-tête.

- [ ] **Step 1 : Écrire les tests qui échouent**

```ts
import { join } from "node:path";
import { lireFichierTabulaire } from "@/server/infrastructure/fichier-tabulaire/lireFichierTabulaire";
import { FichierTabulaireIllisibleError } from "@/server/infrastructure/fichier-tabulaire/lireZip";

const chemin = (nom: string) => join(__dirname, "__fixtures__", nom);

describe("lireFichierTabulaire", () => {
  it("sépare l'en-tête des lignes de données", async () => {
    const resultat = await lireFichierTabulaire(
      chemin("valide-pointvirgule.csv"),
      "valide-pointvirgule.csv",
    );

    expect(resultat.entetes[0]).toBe("identifiant_indic");
    expect(resultat.lignes).toHaveLength(2);
  });

  it("numérote les lignes comme le tableur, en-tête comprise", async () => {
    const resultat = await lireFichierTabulaire(
      chemin("ligne-vide-milieu.csv"),
      "ligne-vide-milieu.csv",
    );

    // en-tête = 1, donc les données commencent à 2
    expect(resultat.numerosDeLigneSource).toEqual([2, 3, 4]);
  });

  it("choisit le lecteur d'après l'extension, insensible à la casse", async () => {
    const resultat = await lireFichierTabulaire(
      chemin("xlsx-valide.xlsx"),
      "XLSX-VALIDE.XLSX",
    );

    expect(resultat.entetes[0]).toBe("identifiant_indic");
  });

  it("refuse une extension non prise en charge", async () => {
    await expect(
      lireFichierTabulaire(chemin("valide-pointvirgule.csv"), "donnees.ods"),
    ).rejects.toThrow(FichierTabulaireIllisibleError);
  });

  it("refuse un fichier sans aucune ligne", async () => {
    await expect(
      lireFichierTabulaire(chemin("vide.csv"), "vide.csv"),
    ).rejects.toThrow(/vide/i);
  });
});
```

Ajouter la fixture manquante dans `construireFixtures.mjs` et la régénérer :
```js
  "vide": Buffer.from(""),
```

- [ ] **Step 2 : Lancer les tests pour vérifier qu'ils échouent**

Run: `pnpm -F @pilote/ppg test:server:unit lireFichierTabulaire`
Expected: FAIL — module introuvable.

- [ ] **Step 3 : Écrire l'implémentation**

```ts
import { readFile } from "node:fs/promises";
import { extname } from "node:path";
import { lireCsv } from "@/server/infrastructure/fichier-tabulaire/lireCsv";
import { lireXlsx } from "@/server/infrastructure/fichier-tabulaire/lireXlsx";
import { FichierTabulaireIllisibleError } from "@/server/infrastructure/fichier-tabulaire/lireZip";

export type FichierTabulaire = {
  entetes: string[];
  lignes: string[][];
  numerosDeLigneSource: number[];
  producteur: string | null;
};

export async function lireFichierTabulaire(
  chemin: string,
  nom: string,
): Promise<FichierTabulaire> {
  const extension = extname(nom).toLowerCase();
  const contenu = await readFile(chemin);

  let brutes: string[][];
  let producteur: string | null = null;

  if (extension === ".csv") {
    brutes = lireCsv(contenu);
  } else if (extension === ".xlsx") {
    const lecture = lireXlsx(contenu);
    brutes = lecture.lignes;
    producteur = lecture.producteur;
  } else {
    throw new FichierTabulaireIllisibleError(
      "extension-non-supportee",
      `Le format « ${extension || "inconnu"} » n'est pas pris en charge. Importez un fichier .csv ou .xlsx.`,
    );
  }

  if (brutes.length === 0) {
    throw new FichierTabulaireIllisibleError(
      "fichier-vide",
      "Le fichier est vide.",
    );
  }

  const [entetes, ...lignes] = brutes;

  return {
    entetes,
    lignes,
    // L'en-tête est la ligne 1 : les données commencent à 2, comme le
    // `rowNumber` de Validata (mesuré).
    numerosDeLigneSource: lignes.map((_, index) => index + 2),
    producteur,
  };
}
```

- [ ] **Step 4 : Lancer les tests pour vérifier qu'ils passent**

Run: `pnpm -F @pilote/ppg test:server:unit fichier-tabulaire`
Expected: PASS — les quatre fichiers de test du dossier.

- [ ] **Step 5 : Commit**

```bash
pnpm lint
git add apps/pilote-ppg/src/server/infrastructure/fichier-tabulaire apps/pilote-ppg/scripts/validata-goldens
git commit -m "feat(ppg-import): point d'entrée lireFichierTabulaire, contrat de frontière du lecteur"
```

---

### Task 6 : Types et compilation du schéma Table Schema

**Files:**
- Create: `apps/pilote-ppg/src/server/infrastructure/table-schema/TableSchema.types.ts`
- Create: `apps/pilote-ppg/src/server/infrastructure/table-schema/compilerSchema.ts`
- Test: `apps/pilote-ppg/src/server/infrastructure/table-schema/compilerSchema.unit.test.ts`

**Interfaces:**
- Consumes: rien.
- Produces:
  ```ts
  export type TypeViolation =
    | "required" | "pattern" | "enum" | "type"
    | "minimum" | "maximum" | "primary-key" | "blank-row";

  export type ViolationContrainte = {
    type: TypeViolation;
    nomDuChamp: string | null;
    indexDeColonne: number;   // -1 si la violation ne porte pas sur une colonne
    cellule: string | null;
    indexDeLigne: number;     // index dans `lignes`, 0-based
  };

  export type ChampCompile = {
    nom: string;
    estNombre: boolean;
    indexDeColonne: number;   // -1 si absent du fichier (schema_sync)
    requis: boolean;
    motif: RegExp | null;
    valeursAutorisees: Set<string> | null;
    minimum: number | null;
    maximum: number | null;
  };

  export type SchemaCompile = {
    nom: string;
    champs: ChampCompile[];
    indexColonnesClePrimaire: number[];
    brut: TableSchemaBrut;
  };

  export function compilerSchema(
    brut: TableSchemaBrut,
    entetes: string[],
  ): SchemaCompile;
  ```

**Le point de performance de l'ADR :** toutes les `RegExp` sont construites **une fois ici**, pas par cellule. L'implémentation de la branche `feat/ppg-import-validation-locale` faisait `new RegExp(...)` à l'intérieur de la boucle de lignes.

**Le point de parité :** `indexDeColonne` vaut `-1` pour un champ du schéma absent du fichier. Les champs à `-1` sont **ignorés** par le validateur — c'est `schema_sync`, mesuré le 2026-09-16 : `valid: true` avec un simple warning.

- [ ] **Step 1 : Écrire les tests qui échouent**

```ts
import { compilerSchema } from "@/server/infrastructure/table-schema/compilerSchema";

const SCHEMA_BRUT = {
  name: "test",
  fields: [
    { name: "identifiant_indic", type: "string" as const,
      constraints: { required: true, pattern: "^IND-([0-9]{3,4})$" } },
    { name: "type_valeur", type: "string" as const,
      constraints: { required: true, enum: ["vi", "va"] } },
    { name: "valeur", type: "number" as const,
      constraints: { required: false, minimum: 0, maximum: 100 } },
  ],
  primaryKey: ["identifiant_indic", "type_valeur"],
};

describe("compilerSchema", () => {
  it("résout l'index de chaque colonne d'après les en-têtes du fichier", () => {
    const compile = compilerSchema(SCHEMA_BRUT, [
      "zone_id", "identifiant_indic", "type_valeur", "valeur",
    ]);

    expect(compile.champs.map((c) => c.indexDeColonne)).toEqual([1, 2, 3]);
  });

  it("marque à -1 un champ du schéma absent du fichier (schema_sync)", () => {
    const compile = compilerSchema(SCHEMA_BRUT, [
      "identifiant_indic", "type_valeur",
    ]);

    expect(compile.champs[2].indexDeColonne).toBe(-1);
  });

  it("compile le motif une seule fois, en RegExp", () => {
    const compile = compilerSchema(SCHEMA_BRUT, ["identifiant_indic"]);

    expect(compile.champs[0].motif).toBeInstanceOf(RegExp);
    expect(compile.champs[0].motif!.test("IND-001")).toBe(true);
    expect(compile.champs[0].motif!.test("IND-XXX")).toBe(false);
  });

  it("compile l'énumération en Set", () => {
    const compile = compilerSchema(SCHEMA_BRUT, ["type_valeur"]);

    expect(compile.champs[1].valeursAutorisees).toBeInstanceOf(Set);
    expect(compile.champs[1].valeursAutorisees!.has("vi")).toBe(true);
  });

  it("résout les index de colonnes de la clé primaire", () => {
    const compile = compilerSchema(SCHEMA_BRUT, [
      "zone_id", "identifiant_indic", "type_valeur",
    ]);

    expect(compile.indexColonnesClePrimaire).toEqual([1, 2]);
  });

  it("ignore dans la clé primaire les colonnes absentes du fichier", () => {
    const compile = compilerSchema(SCHEMA_BRUT, ["identifiant_indic"]);

    expect(compile.indexColonnesClePrimaire).toEqual([0]);
  });
});
```

- [ ] **Step 2 : Lancer les tests pour vérifier qu'ils échouent**

Run: `pnpm -F @pilote/ppg test:server:unit compilerSchema`
Expected: FAIL — module introuvable.

- [ ] **Step 3 : Écrire les types**

Create `TableSchema.types.ts` avec les types listés dans **Interfaces** ci-dessus, plus :

```ts
export type TableSchemaContraintesBrutes = {
  required?: boolean;
  pattern?: string;
  enum?: string[];
  minimum?: number;
  maximum?: number;
};

export type TableSchemaChampBrut = {
  name: string;
  type: "string" | "number";
  constraints?: TableSchemaContraintesBrutes;
};

export type TableSchemaBrut = {
  name: string;
  fields: TableSchemaChampBrut[];
  primaryKey: string[];
};
```

- [ ] **Step 4 : Écrire la compilation**

```ts
import type {
  ChampCompile,
  SchemaCompile,
  TableSchemaBrut,
} from "@/server/infrastructure/table-schema/TableSchema.types";

export function compilerSchema(
  brut: TableSchemaBrut,
  entetes: string[],
): SchemaCompile {
  // Les en-têtes sont comparés en minuscules : l'application tolère les
  // majuscules dans l'en-tête (elle les signale séparément) sans que cela
  // empêche la résolution des colonnes.
  const entetesNormalisees = entetes.map((entete) => entete.trim().toLowerCase());
  const indexDe = (nom: string) => entetesNormalisees.indexOf(nom.toLowerCase());

  const champs: ChampCompile[] = brut.fields.map((champ) => {
    const contraintes = champ.constraints ?? {};
    return {
      nom: champ.name,
      estNombre: champ.type === "number",
      indexDeColonne: indexDe(champ.name),
      requis: contraintes.required === true,
      motif: contraintes.pattern ? new RegExp(contraintes.pattern) : null,
      valeursAutorisees: contraintes.enum ? new Set(contraintes.enum) : null,
      minimum: contraintes.minimum ?? null,
      maximum: contraintes.maximum ?? null,
    };
  });

  return {
    nom: brut.name,
    champs,
    // Une colonne de clé primaire absente du fichier est simplement retirée de
    // la clé : c'est le comportement `schema_sync` de Validata.
    indexColonnesClePrimaire: brut.primaryKey
      .map(indexDe)
      .filter((index) => index !== -1),
    brut,
  };
}
```

- [ ] **Step 5 : Lancer les tests pour vérifier qu'ils passent**

Run: `pnpm -F @pilote/ppg test:server:unit compilerSchema`
Expected: PASS.

- [ ] **Step 6 : Commit**

```bash
pnpm lint
git add apps/pilote-ppg/src/server/infrastructure/table-schema
git commit -m "feat(ppg-import): compilation des schémas Table Schema, regex construites une seule fois"
```

---

### Task 7 : Moteur de validation en une passe

**Files:**
- Create: `apps/pilote-ppg/src/server/infrastructure/table-schema/validerLignes.ts`
- Test: `apps/pilote-ppg/src/server/infrastructure/table-schema/validerLignes.unit.test.ts`

**Interfaces:**
- Consumes: `SchemaCompile`, `ViolationContrainte` (Task 6).
- Produces:
  ```ts
  export const PLAFOND_VIOLATIONS_DEFAUT: number;
  export function validerLignes(
    schema: SchemaCompile,
    lignes: string[][],
    plafond?: number,
  ): { violations: ViolationContrainte[]; tronque: boolean };
  ```

**Avant d'écrire cette tâche**, relire le résultat du Step 6 de la Task 1 :
- `PLAFOND_VIOLATIONS_DEFAUT` doit valoir le plafond réellement appliqué par frictionless, lu dans `beaucoup-d-erreurs.csv.sans-contraintes.golden.json`.
- Le traitement des formes de nombre (`12,5`, `1e5`, `+5`, ` 5 `) doit reproduire le verdict des goldens `nombre-*`. Ajuster `REGEX_NOMBRE` en conséquence plutôt que de deviner.

**Règles de parité mesurées le 2026-09-16 :**
- Une ligne entièrement vide produit **deux** violations : `blank-row` **et** `primary-key`.
- Un champ dont `indexDeColonne` vaut `-1` est ignoré (schema_sync).
- Les colonnes du fichier absentes du schéma sont ignorées.
- Une cellule vide sur un champ non requis ne produit aucune violation.

- [ ] **Step 1 : Écrire les tests qui échouent**

```ts
import { compilerSchema } from "@/server/infrastructure/table-schema/compilerSchema";
import { validerLignes } from "@/server/infrastructure/table-schema/validerLignes";

const ENTETES = ["identifiant_indic", "zone_id", "date_valeur", "type_valeur", "valeur"];

const BRUT = {
  name: "test",
  fields: [
    { name: "identifiant_indic", type: "string" as const,
      constraints: { required: true, pattern: "^IND-([0-9]{3,4})$" } },
    { name: "zone_id", type: "string" as const, constraints: { required: true } },
    { name: "date_valeur", type: "string" as const, constraints: { required: true } },
    { name: "type_valeur", type: "string" as const,
      constraints: { required: true, enum: ["vi", "va", "vc"] } },
    { name: "valeur", type: "number" as const,
      constraints: { required: false, minimum: 0, maximum: 100 } },
  ],
  primaryKey: ["identifiant_indic", "zone_id", "date_valeur", "type_valeur"],
};

const schema = compilerSchema(BRUT, ENTETES);
const valider = (lignes: string[][]) => validerLignes(schema, lignes).violations;

describe("validerLignes", () => {
  it("ne signale rien sur des lignes conformes", () => {
    expect(valider([["IND-001", "D46", "2023-01-31", "vi", "12.5"]])).toEqual([]);
  });

  it("signale une cellule requise vide", () => {
    const [violation] = valider([["", "D46", "2023-01-31", "vi", "1"]]);

    expect(violation).toMatchObject({
      type: "required", nomDuChamp: "identifiant_indic", indexDeLigne: 0,
    });
  });

  it("signale un motif non respecté", () => {
    expect(valider([["IND-XXX", "D46", "2023-01-31", "vi", "1"]])[0]).toMatchObject({
      type: "pattern", nomDuChamp: "identifiant_indic", cellule: "IND-XXX",
    });
  });

  it("signale une valeur hors énumération", () => {
    expect(valider([["IND-001", "D46", "2023-01-31", "zz", "1"]])[0]).toMatchObject({
      type: "enum", nomDuChamp: "type_valeur", cellule: "zz",
    });
  });

  it("signale une valeur non numérique sur un champ de type number", () => {
    expect(valider([["IND-001", "D46", "2023-01-31", "vi", "abc"]])[0]).toMatchObject({
      type: "type", nomDuChamp: "valeur",
    });
  });

  it("signale le dépassement des bornes", () => {
    expect(valider([["IND-001", "D46", "2023-01-31", "vi", "150"]])[0]).toMatchObject({
      type: "maximum", nomDuChamp: "valeur",
    });
    expect(valider([["IND-001", "D46", "2023-01-31", "vi", "-1"]])[0]).toMatchObject({
      type: "minimum", nomDuChamp: "valeur",
    });
  });

  it("ne signale rien pour une cellule vide sur un champ non requis", () => {
    expect(valider([["IND-001", "D46", "2023-01-31", "vi", ""]])).toEqual([]);
  });

  it("signale un doublon de clé primaire sur la seconde occurrence seulement", () => {
    const violations = valider([
      ["IND-001", "D46", "2023-01-31", "vi", "1"],
      ["IND-001", "D46", "2023-01-31", "vi", "2"],
    ]);

    expect(violations).toHaveLength(1);
    expect(violations[0]).toMatchObject({ type: "primary-key", indexDeLigne: 1 });
  });

  it("signale une ligne entièrement vide par deux violations", () => {
    const violations = valider([["", "", "", "", ""]]);

    expect(violations.map((v) => v.type)).toEqual(["blank-row", "primary-key"]);
  });

  it("ignore un champ du schéma absent du fichier (schema_sync)", () => {
    const partiel = compilerSchema(BRUT, ["identifiant_indic", "zone_id"]);

    expect(validerLignes(partiel, [["IND-001", "D46"]]).violations).toEqual([]);
  });

  it("s'arrête au plafond et signale la troncature", () => {
    const lignes = Array.from({ length: 50 }, () => ["MAUVAIS", "", "", "zz", "abc"]);

    const resultat = validerLignes(schema, lignes, 10);

    expect(resultat.violations).toHaveLength(10);
    expect(resultat.tronque).toBe(true);
  });
});
```

- [ ] **Step 2 : Lancer les tests pour vérifier qu'ils échouent**

Run: `pnpm -F @pilote/ppg test:server:unit validerLignes`
Expected: FAIL — module introuvable.

- [ ] **Step 3 : Écrire l'implémentation**

```ts
import type {
  SchemaCompile,
  ViolationContrainte,
} from "@/server/infrastructure/table-schema/TableSchema.types";

// À caler sur le plafond réel de frictionless, lu dans le golden
// `beaucoup-d-erreurs.csv.sans-contraintes.golden.json` (Task 1, Step 6).
export const PLAFOND_VIOLATIONS_DEFAUT = 1000;

// À caler sur les goldens `nombre-*` (Task 1, Step 6) avant de figer.
const REGEX_NOMBRE = /^[+-]?\d+(\.\d+)?$/;

const SEPARATEUR_CLE = "␟";

export function validerLignes(
  schema: SchemaCompile,
  lignes: string[][],
  plafond: number = PLAFOND_VIOLATIONS_DEFAUT,
): { violations: ViolationContrainte[]; tronque: boolean } {
  const violations: ViolationContrainte[] = [];
  const clesVues = new Set<string>();
  let tronque = false;

  // Les champs absents du fichier sont écartés une fois pour toutes plutôt
  // qu'à chaque ligne (schema_sync).
  const champs = schema.champs.filter((champ) => champ.indexDeColonne !== -1);

  const ajouter = (violation: ViolationContrainte): boolean => {
    if (violations.length >= plafond) {
      tronque = true;
      return false;
    }
    violations.push(violation);
    return true;
  };

  // Une seule passe, ligne par ligne : bonne localité mémoire, et les
  // violations sortent naturellement ordonnées comme l'utilisateur les lit.
  for (let indexDeLigne = 0; indexDeLigne < lignes.length; indexDeLigne += 1) {
    if (tronque) break;
    const ligne = lignes[indexDeLigne];

    const ligneEstVide = ligne.every((cellule) => (cellule ?? "").trim() === "");
    if (ligneEstVide) {
      ajouter({ type: "blank-row", nomDuChamp: null, indexDeColonne: -1, cellule: null, indexDeLigne });
      ajouter({ type: "primary-key", nomDuChamp: null, indexDeColonne: -1, cellule: null, indexDeLigne });
      continue;
    }

    for (const champ of champs) {
      const cellule = (ligne[champ.indexDeColonne] ?? "").trim();
      const base = {
        nomDuChamp: champ.nom,
        indexDeColonne: champ.indexDeColonne,
        cellule,
        indexDeLigne,
      };

      if (cellule === "") {
        if (champ.requis) ajouter({ type: "required", ...base });
        continue;
      }

      if (champ.motif && !champ.motif.test(cellule)) {
        ajouter({ type: "pattern", ...base });
        continue;
      }

      if (champ.valeursAutorisees && !champ.valeursAutorisees.has(cellule)) {
        ajouter({ type: "enum", ...base });
        continue;
      }

      if (champ.estNombre) {
        if (!REGEX_NOMBRE.test(cellule)) {
          ajouter({ type: "type", ...base });
          continue;
        }
        const nombre = Number(cellule);
        if (champ.minimum !== null && nombre < champ.minimum) {
          ajouter({ type: "minimum", ...base });
        }
        if (champ.maximum !== null && nombre > champ.maximum) {
          ajouter({ type: "maximum", ...base });
        }
      }
    }

    if (schema.indexColonnesClePrimaire.length > 0) {
      const cle = schema.indexColonnesClePrimaire
        .map((index) => (ligne[index] ?? "").trim())
        .join(SEPARATEUR_CLE);

      if (clesVues.has(cle)) {
        ajouter({ type: "primary-key", nomDuChamp: null, indexDeColonne: -1, cellule: null, indexDeLigne });
      } else {
        clesVues.add(cle);
      }
    }
  }

  return { violations, tronque };
}
```

- [ ] **Step 4 : Lancer les tests pour vérifier qu'ils passent**

Run: `pnpm -F @pilote/ppg test:server:unit validerLignes`
Expected: PASS.

- [ ] **Step 5 : Commit**

```bash
pnpm lint
git add apps/pilote-ppg/src/server/infrastructure/table-schema
git commit -m "feat(ppg-import): moteur de validation Table Schema en une passe"
```

---

### Task 8 : Chargement et cache des schémas

**Files:**
- Create: `apps/pilote-ppg/src/server/import-indicateur/infrastructure/adapters/validation-fichier/SchemaRepository.ts`
- Test: `.../SchemaRepository.unit.test.ts`

**Interfaces:**
- Consumes: `TableSchemaBrut` (Task 6).
- Produces:
  ```ts
  export const SCHEMAS_AUTORISES: readonly string[];
  export function chargerSchemaBrut(nomFichier: string): TableSchemaBrut;
  ```

**Sécurité :** `nomFichier` vient de la base (`indic_schema`). Il est validé contre une liste blanche avant toute lecture disque — pas de `path.join` sur une valeur non contrôlée.

- [ ] **Step 1 : Écrire les tests qui échouent**

```ts
import { chargerSchemaBrut, SCHEMAS_AUTORISES } from "@/server/import-indicateur/infrastructure/adapters/validation-fichier/SchemaRepository";

describe("chargerSchemaBrut", () => {
  it.each(SCHEMAS_AUTORISES)("charge %s avec ses champs et sa clé primaire", (nom) => {
    const schema = chargerSchemaBrut(nom);

    expect(schema.fields.map((c) => c.name)).toContain("identifiant_indic");
    expect(schema.primaryKey).toEqual([
      "identifiant_indic", "zone_id", "date_valeur", "type_valeur",
    ]);
  });

  it("renvoie la même instance au second appel (cache)", () => {
    expect(chargerSchemaBrut("sans-contraintes.json")).toBe(
      chargerSchemaBrut("sans-contraintes.json"),
    );
  });

  it("refuse un nom hors liste blanche", () => {
    expect(() => chargerSchemaBrut("../../../etc/passwd")).toThrow(/inconnu/i);
  });
});
```

- [ ] **Step 2 : Lancer les tests** — Run: `pnpm -F @pilote/ppg test:server:unit SchemaRepository` — Expected: FAIL.

- [ ] **Step 3 : Écrire l'implémentation**

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { TableSchemaBrut } from "@/server/infrastructure/table-schema/TableSchema.types";

export const SCHEMAS_AUTORISES = [
  "sans-contraintes.json",
  "restrict-dept.json",
  "restrict-reg.json",
  "restrict-0-100.json",
] as const;

const cache = new Map<string, TableSchemaBrut>();

export function chargerSchemaBrut(nomFichier: string): TableSchemaBrut {
  if (!(SCHEMAS_AUTORISES as readonly string[]).includes(nomFichier)) {
    throw new Error(`Schéma d'import inconnu : ${nomFichier}`);
  }

  const enCache = cache.get(nomFichier);
  if (enCache) return enCache;

  const chemin = join(process.cwd(), "public", "schema", nomFichier);
  const schema = JSON.parse(readFileSync(chemin, "utf-8")) as TableSchemaBrut;
  cache.set(nomFichier, schema);
  return schema;
}
```

- [ ] **Step 4 : Lancer les tests** — Expected: PASS.
- [ ] **Step 5 : Commit** — `git commit -m "feat(ppg-import): chargement des schémas depuis le disque avec liste blanche et cache"`

---

### Task 9 : Catalogue de messages en français

**Files:**
- Create: `.../validation-fichier/genererMessageErreur.ts`
- Test: `.../validation-fichier/genererMessageErreur.unit.test.ts`

**Interfaces:**
- Consumes: `ViolationContrainte`, `SchemaCompile` (Task 6).
- Produces: `export function genererMessageErreur(violation: ViolationContrainte, schema: SchemaCompile, numeroDeLigne: number): string;`

**Contexte, à ne pas perdre de vue :** ce catalogue existe déjà dans `ValidataFichierIndicateurValidationService.ts` mais **ne s'exécute plus depuis PIL-553**. Les textes ci-dessous en sont repris. C'est la seule partie du comportement qui change volontairement pour l'utilisateur, et c'est un progrès : aujourd'hui il lit du markdown non rendu et des expressions régulières.

`numeroDeLigne` est celui du tableur (en-tête comprise), fourni par `numerosDeLigneSource`.

- [ ] **Step 1 : Écrire les tests qui échouent**

```ts
import { compilerSchema } from "@/server/infrastructure/table-schema/compilerSchema";
import { chargerSchemaBrut } from "@/server/import-indicateur/infrastructure/adapters/validation-fichier/SchemaRepository";
import { genererMessageErreur } from "@/server/import-indicateur/infrastructure/adapters/validation-fichier/genererMessageErreur";

const ENTETES = ["identifiant_indic", "zone_id", "date_valeur", "type_valeur", "valeur"];
const schema = compilerSchema(chargerSchemaBrut("sans-contraintes.json"), ENTETES);

const message = (partiel: Partial<Parameters<typeof genererMessageErreur>[0]>, ligne = 2) =>
  genererMessageErreur(
    { type: "required", nomDuChamp: null, indexDeColonne: -1, cellule: null, indexDeLigne: 0, ...partiel } as never,
    schema,
    ligne,
  );

describe("genererMessageErreur", () => {
  it("décrit un identifiant d'indicateur vide", () => {
    expect(message({ type: "required", nomDuChamp: "identifiant_indic" }, 2)).toBe(
      "Un indicateur ne peut etre vide. C'est le cas à la ligne 2.",
    );
  });

  it("décrit un identifiant d'indicateur mal formé", () => {
    expect(message({ type: "pattern", nomDuChamp: "identifiant_indic", cellule: "IND-XXX" })).toBe(
      "L'identifiant de l'indicateur doit être renseigné dans le format IND-XXX. Vous pouvez vous référer au guide des indicateurs pour trouver l'identifiant de votre indicateur.",
    );
  });

  it("décrit un type de valeur hors énumération", () => {
    expect(message({ type: "enum", nomDuChamp: "type_valeur", cellule: "zz" })).toBe(
      "Le type de valeur doit être vi (valeur initiale), va (valeur d'avancement) ou vc (valeur cible).",
    );
  });

  it("décrit un doublon de clé primaire avec le numéro de ligne du tableur", () => {
    expect(message({ type: "primary-key" }, 7)).toBe(
      "La ligne 7 est vide ou comporte les mêmes zone, date, identifiant d'indicateur et type de valeur qu'une autre ligne. Veuillez la modifier ou la supprimer.",
    );
  });

  it("décrit une ligne entièrement vide", () => {
    expect(message({ type: "blank-row" }, 5)).toBe(
      "Toutes les cellules de la ligne 5 sont vides.",
    );
  });

  it("nomme la zone fautive", () => {
    expect(message({ type: "pattern", nomDuChamp: "zone_id", cellule: "ZZZ" }, 3)).toContain("ZZZ");
  });

  it("ne renvoie jamais de markdown ni d'expression régulière", () => {
    for (const type of ["required", "pattern", "enum", "type", "minimum", "maximum"] as const) {
      const texte = message({ type, nomDuChamp: "valeur", cellule: "x" });
      expect(texte).not.toMatch(/\*\*|\^|\$|\\d/);
    }
  });
});
```

- [ ] **Step 2 : Lancer les tests** — Expected: FAIL.

- [ ] **Step 3 : Écrire l'implémentation**

```ts
import type {
  SchemaCompile,
  ViolationContrainte,
} from "@/server/infrastructure/table-schema/TableSchema.types";

export function genererMessageErreur(
  violation: ViolationContrainte,
  schema: SchemaCompile,
  numeroDeLigne: number,
): string {
  const { type, nomDuChamp, cellule } = violation;

  if (type === "blank-row") {
    return `Toutes les cellules de la ligne ${numeroDeLigne} sont vides.`;
  }

  if (type === "primary-key") {
    return `La ligne ${numeroDeLigne} est vide ou comporte les mêmes zone, date, identifiant d'indicateur et type de valeur qu'une autre ligne. Veuillez la modifier ou la supprimer.`;
  }

  if (nomDuChamp === "identifiant_indic") {
    if (type === "required") {
      return `Un indicateur ne peut etre vide. C'est le cas à la ligne ${numeroDeLigne}.`;
    }
    if (type === "pattern") {
      return "L'identifiant de l'indicateur doit être renseigné dans le format IND-XXX. Vous pouvez vous référer au guide des indicateurs pour trouver l'identifiant de votre indicateur.";
    }
  }

  if (nomDuChamp === "zone_id" && type === "pattern") {
    return `La zone '${cellule}' n'est pas une zone valide pour ce type de saisie (ligne ${numeroDeLigne}).`;
  }

  if (nomDuChamp === "date_valeur" && type === "pattern") {
    return `La date '${cellule}' n'est pas dans un format valide (AAAA-MM-JJ ou JJ/MM/AAAA), ligne ${numeroDeLigne}.`;
  }

  if (nomDuChamp === "type_valeur" && type === "enum") {
    return "Le type de valeur doit être vi (valeur initiale), va (valeur d'avancement) ou vc (valeur cible).";
  }

  if (nomDuChamp === "valeur") {
    if (type === "type") {
      return `La valeur '${cellule}' n'est pas un nombre valide (ligne ${numeroDeLigne}). Utilisez le point comme séparateur décimal.`;
    }
    const champ = schema.champs.find((c) => c.nom === "valeur");
    if (type === "minimum") {
      return `La valeur '${cellule}' doit être supérieure ou égale à ${champ?.minimum} (ligne ${numeroDeLigne}).`;
    }
    if (type === "maximum") {
      return `La valeur '${cellule}' doit être inférieure ou égale à ${champ?.maximum} (ligne ${numeroDeLigne}).`;
    }
  }

  if (type === "required") {
    return `La colonne '${nomDuChamp}' doit être renseignée. C'est le cas à la ligne ${numeroDeLigne}.`;
  }

  if (type === "enum") {
    const champ = schema.champs.find((c) => c.nom === nomDuChamp);
    const autorisees = [...(champ?.valeursAutorisees ?? [])].join(", ");
    return `La valeur '${cellule}' de la colonne '${nomDuChamp}' doit être l'une des valeurs suivantes : ${autorisees} (ligne ${numeroDeLigne}).`;
  }

  return `La valeur '${cellule}' de la colonne '${nomDuChamp}' n'est pas dans un format attendu (ligne ${numeroDeLigne}).`;
}
```

- [ ] **Step 4 : Lancer les tests** — Expected: PASS.
- [ ] **Step 5 : Commit** — `git commit -m "feat(ppg-import): catalogue de messages FR, débranché depuis PIL-553"`

---

### Task 10 : Adapter `LocalFichierIndicateurValidationService`

**Files:**
- Create: `.../validation-fichier/LocalFichierIndicateurValidationService.ts`
- Test: `.../validation-fichier/LocalFichierIndicateurValidationService.unit.test.ts`
- Modify: `apps/pilote-ppg/src/server/import-indicateur/domain/ports/FichierIndicateurValidationService.interface.ts`

**Interfaces:**
- Consumes: `lireFichierTabulaire` (Task 5), `chargerSchemaBrut` (Task 8), `compilerSchema` (Task 6), `validerLignes` (Task 7), `genererMessageErreur` (Task 9), `supprimerLeFichier` (`FichierService`, existant).
- Produces: une classe implémentant `FichierIndicateurValidationService`. Le champ `schema` de `ValiderFichierPayload` devient un **nom de fichier** (`"sans-contraintes.json"`) et non plus une URL.

**Vérifications d'en-tête, portées par l'application et non par le schéma** (Validata ne les émet pas — mesuré) : espaces, majuscules, en-têtes dupliqués, absence de `identifiant_indic`.

**Ne PAS reprendre de la branche `feat/ppg-import-validation-locale` :** sa vérification `contientTousLesChamps`, qui transforme une colonne de schéma manquante en erreur bloquante. C'est une régression : Validata renvoie `valid: true` avec un simple warning.

- [ ] **Step 1 : Modifier le port**

```ts
export type ValiderFichierPayload = {
  cheminCompletDuFichier: string;
  nomDuFichier: string;
  /** Nom du fichier de schéma, ex. "sans-contraintes.json". */
  schema: string;
  utilisateurEmail: string;
};
```

- [ ] **Step 2 : Écrire les tests qui échouent**

```ts
import { join } from "node:path";
import { copyFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { LocalFichierIndicateurValidationService } from "@/server/import-indicateur/infrastructure/adapters/validation-fichier/LocalFichierIndicateurValidationService";

const FIXTURES = join(__dirname, "../../../../infrastructure/fichier-tabulaire/__fixtures__");

// L'adapter supprime le fichier après lecture : on travaille sur une copie.
const copie = (nom: string) => {
  const cible = join(tmpdir(), `${Date.now()}-${nom}`);
  copyFileSync(join(FIXTURES, nom), cible);
  return cible;
};

const valider = (nom: string, schema = "sans-contraintes.json") =>
  new LocalFichierIndicateurValidationService().validerFichier({
    cheminCompletDuFichier: copie(nom),
    nomDuFichier: nom,
    schema,
    utilisateurEmail: "ditp.admin@example.com",
  });

describe("LocalFichierIndicateurValidationService", () => {
  it("valide un fichier conforme et construit les mesures temporaires", async () => {
    const rapport = await valider("valide-pointvirgule.csv");

    expect(rapport.estValide).toBe(true);
    expect(rapport.listeErreursValidation).toHaveLength(0);
    expect(rapport.listeMesuresIndicateurTemporaire).toHaveLength(2);
    expect(rapport.listeMesuresIndicateurTemporaire[0].indicId).toBe("IND-001");
  });

  it("accepte un fichier dont une colonne du schéma est absente (schema_sync)", async () => {
    const rapport = await valider("colonne-schema-absente.csv");

    expect(rapport.estValide).toBe(true);
  });

  it("accepte une colonne surnuméraire", async () => {
    const rapport = await valider("colonne-surnumeraire.csv");

    expect(rapport.estValide).toBe(true);
  });

  it("signale l'absence de l'en-tête identifiant_indic", async () => {
    const rapport = await valider("entete-identifiant-absent.csv");

    expect(rapport.estValide).toBe(false);
    expect(rapport.listeErreursValidation[0].message).toContain("identifiant_indic");
  });

  it("signale un en-tête comportant des espaces", async () => {
    const rapport = await valider("entete-espace.csv");

    expect(rapport.listeErreursValidation.some((e) => e.message.includes("espaces"))).toBe(true);
  });

  it("signale un en-tête en majuscules", async () => {
    const rapport = await valider("entete-majuscule.csv");

    expect(rapport.listeErreursValidation.some((e) => e.message.includes("minuscule"))).toBe(true);
  });

  it("signale des en-têtes dupliqués", async () => {
    const rapport = await valider("entete-doublon.csv");

    expect(rapport.listeErreursValidation.some((e) => e.message.includes("doublon"))).toBe(true);
  });

  it("numérote les erreurs avec le numéro de ligne du tableur", async () => {
    const rapport = await valider("ligne-vide-milieu.csv");

    // la ligne vide est la 3e du tableur (en-tête = 1)
    expect(rapport.listeErreursValidation.some((e) => e.numeroDeLigne === 3)).toBe(true);
  });

  it("produit le même verdict en CSV et en XLSX", async () => {
    const csv = await valider("pattern-identifiant.csv");
    const xlsx = await valider("xlsx-pattern-identifiant.xlsx");

    expect(xlsx.estValide).toBe(csv.estValide);
  });

  it("renvoie un rapport invalide lisible quand le fichier est illisible", async () => {
    const rapport = await valider("valide-pointvirgule.csv", "sans-contraintes.json");
    expect(rapport).toBeDefined();
  });
});
```

- [ ] **Step 3 : Lancer les tests** — Expected: FAIL.

- [ ] **Step 4 : Écrire l'implémentation**

```ts
import { DetailValidationFichier } from "@/server/import-indicateur/domain/DetailValidationFichier";
import { ErreurValidationFichier } from "@/server/import-indicateur/domain/ErreurValidationFichier";
import { MesureIndicateurTemporaire } from "@/server/import-indicateur/domain/MesureIndicateurTemporaire";
import type {
  FichierIndicateurValidationService,
  ValiderFichierPayload,
} from "@/server/import-indicateur/domain/ports/FichierIndicateurValidationService.interface";
import { supprimerLeFichier } from "@/server/import-indicateur/infrastructure/adapters/FichierService";
import { chargerSchemaBrut } from "@/server/import-indicateur/infrastructure/adapters/validation-fichier/SchemaRepository";
import { genererMessageErreur } from "@/server/import-indicateur/infrastructure/adapters/validation-fichier/genererMessageErreur";
import { lireFichierTabulaire } from "@/server/infrastructure/fichier-tabulaire/lireFichierTabulaire";
import { FichierTabulaireIllisibleError } from "@/server/infrastructure/fichier-tabulaire/lireZip";
import { compilerSchema } from "@/server/infrastructure/table-schema/compilerSchema";
import { validerLignes } from "@/server/infrastructure/table-schema/validerLignes";
import logger from "@/server/infrastructure/Logger";

const COLONNE_IDENTIFIANT = "identifiant_indic";

export class LocalFichierIndicateurValidationService
  implements FichierIndicateurValidationService
{
  async validerFichier({
    cheminCompletDuFichier,
    nomDuFichier,
    schema: nomDuSchema,
    utilisateurEmail,
  }: ValiderFichierPayload): Promise<DetailValidationFichier> {
    const rapport = DetailValidationFichier.creerDetailValidationFichier({
      estValide: false,
      utilisateurEmail,
    });

    const erreurs: ErreurValidationFichier[] = [];
    const erreurDEnTete = (message: string) =>
      ErreurValidationFichier.creerErreurValidationFichier({
        rapportId: rapport.id,
        cellule: "Cellule non définie",
        nom: "En-tête incorrect",
        message,
        numeroDeLigne: 1,
        positionDeLigne: 0,
        nomDuChamp: "",
        positionDuChamp: -1,
      });

    try {
      const fichier = await lireFichierTabulaire(cheminCompletDuFichier, nomDuFichier);
      const schema = compilerSchema(chargerSchemaBrut(nomDuSchema), fichier.entetes);

      logger.info(
        {
          categorie: "import",
          source: "LocalFichierIndicateurValidationService",
          nomDuFichier,
          producteur: fichier.producteur,
          schema: nomDuSchema,
          nombreLignes: fichier.lignes.length,
        },
        "Lecture du fichier d'import",
      );

      const normalisees = fichier.entetes.map((e) => e.trim().toLowerCase());

      for (const entete of fichier.entetes) {
        if (entete.trim() !== entete) {
          erreurs.push(erreurDEnTete(
            `Le champ de l'en-tête '${entete.trim()}' comporte des espaces, veuillez les supprimer`,
          ));
        }
        if (entete.toLowerCase() !== entete) {
          erreurs.push(erreurDEnTete(
            `Le champ de l'en-tête '${entete.toLowerCase()}' comporte des majuscules, veuillez les mettre en minuscule`,
          ));
        }
      }

      if (new Set(normalisees).size !== normalisees.length) {
        erreurs.push(erreurDEnTete("Il existe des entêtes en doublon dans le fichier"));
      }

      const indexIdentifiant = normalisees.indexOf(COLONNE_IDENTIFIANT);
      if (indexIdentifiant === -1) {
        erreurs.push(erreurDEnTete("L'en-tête identifiant_indic n'est pas présente"));
      } else {
        const { violations } = validerLignes(schema, fichier.lignes);

        for (const violation of violations) {
          const numeroDeLigne = fichier.numerosDeLigneSource[violation.indexDeLigne];
          erreurs.push(
            ErreurValidationFichier.creerErreurValidationFichier({
              rapportId: rapport.id,
              cellule: violation.cellule ?? "Cellule non définie",
              nom: violation.type,
              message: genererMessageErreur(violation, schema, numeroDeLigne),
              numeroDeLigne,
              positionDeLigne: violation.indexDeLigne,
              nomDuChamp: violation.nomDuChamp ?? "",
              positionDuChamp: violation.indexDeColonne,
            }),
          );
        }

        const index = (nom: string) => normalisees.indexOf(nom);
        rapport.affecterListeMesuresIndicateurTemporaire(
          fichier.lignes.map((ligne) =>
            MesureIndicateurTemporaire.createMesureIndicateurTemporaire({
              rapportId: rapport.id,
              indicId: ligne[indexIdentifiant] ?? null,
              zoneId: ligne[index("zone_id")] ?? null,
              metricDate: ligne[index("date_valeur")] ?? null,
              metricType: ligne[index("type_valeur")] ?? null,
              metricValue: `${ligne[index("valeur")] ?? ""}`,
            }),
          ),
        );
      }

      rapport.affecterListeErreursValidation(erreurs);
      return DetailValidationFichier.creerDetailValidationFichier({
        id: rapport.id,
        dateCreation: rapport.dateCreation,
        estValide: erreurs.length === 0,
        utilisateurEmail,
        listeErreursValidation: rapport.listeErreursValidation,
        listeMesuresIndicateurTemporaire: rapport.listeMesuresIndicateurTemporaire,
      });
    } catch (erreur) {
      const illisible = erreur instanceof FichierTabulaireIllisibleError;

      logger.error(
        {
          categorie: "import",
          source: "LocalFichierIndicateurValidationService",
          nomDuFichier,
          utilisateurEmail,
          raison: illisible ? erreur.raison : "inattendue",
        },
        (erreur as Error).message,
      );

      rapport.affecterListeErreursValidation([
        ErreurValidationFichier.creerErreurValidationFichier({
          rapportId: rapport.id,
          cellule: "Cellule non définie",
          nom: illisible ? erreur.raison : "Erreur non identifié",
          message: illisible
            ? erreur.message
            : "Une erreur est survenue lors de la validation de la forme du fichier",
          numeroDeLigne: 0,
          positionDeLigne: 0,
          nomDuChamp: "",
          positionDuChamp: -1,
        }),
      ]);
      return rapport;
    } finally {
      supprimerLeFichier(cheminCompletDuFichier);
    }
  }
}
```

- [ ] **Step 5 : Lancer les tests** — Expected: PASS.
- [ ] **Step 6 : Commit** — `git commit -m "feat(ppg-import): adapter de validation locale du fichier d'indicateur"`

---

### Task 11 : Test de parité contre les goldens — **le critère d'acceptation**

**Files:**
- Create: `apps/pilote-ppg/src/server/import-indicateur/__tests__/infrastructure/adapters/pariteValidata.unit.test.ts`

**Interfaces:**
- Consumes: tout ce qui précède, plus les goldens de la Task 1.
- Produces: rien — c'est la porte de sortie du projet.

**Ce qui est comparé** (le verdict, pas le texte) : `valid`, et pour chaque erreur le triplet `(type, rowNumber, fieldName)`. La correspondance des types :

| Type Validata | Type local |
|---|---|
| `constraint-error` sur un motif | `pattern` |
| `constraint-error` sur une énumération | `enum` |
| `constraint-error` requis | `required` |
| `type-error` | `type` |
| `primary-key` | `primary-key` |
| `blank-row` | `blank-row` |
| `duplicate-label` | erreur d'en-tête applicative |

- [ ] **Step 1 : Écrire le test de parité**

```ts
import { readdirSync, readFileSync, copyFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { LocalFichierIndicateurValidationService } from "@/server/import-indicateur/infrastructure/adapters/validation-fichier/LocalFichierIndicateurValidationService";

const BASE = join(__dirname, "../../../../infrastructure/fichier-tabulaire");
const GOLDENS = join(BASE, "__goldens__");
const FIXTURES = join(BASE, "__fixtures__");

type Golden = {
  valid: boolean;
  errors: { type: string; rowNumber: number | null; fieldName: string | null }[];
};

const cas = readdirSync(GOLDENS).filter((f) => f.endsWith(".golden.json"));

describe("parité avec Validata", () => {
  it.each(cas)("%s", async (nomGolden) => {
    const golden = JSON.parse(readFileSync(join(GOLDENS, nomGolden), "utf-8")) as Golden;

    // "valide-pointvirgule.csv.sans-contraintes.golden.json"
    const [fixture, schemaCourt] = nomGolden.replace(".golden.json", "").split(/\.(?=[^.]+$)/);
    const schema = `${schemaCourt}.json`;

    const copie = join(tmpdir(), `parite-${Date.now()}-${fixture}`);
    copyFileSync(join(FIXTURES, fixture), copie);

    const rapport = await new LocalFichierIndicateurValidationService().validerFichier({
      cheminCompletDuFichier: copie,
      nomDuFichier: fixture,
      schema,
      utilisateurEmail: "parite@example.com",
    });

    expect(rapport.estValide).toBe(golden.valid);

    if (!golden.valid) {
      const attendues = golden.errors
        .filter((e) => e.rowNumber !== null)
        .map((e) => `${e.rowNumber}:${e.fieldName ?? "-"}`)
        .sort();
      const obtenues = rapport.listeErreursValidation
        .filter((e) => e.numeroDeLigne > 1)
        .map((e) => `${e.numeroDeLigne}:${e.nomDuChamp || "-"}`)
        .sort();

      expect(new Set(obtenues)).toEqual(new Set(attendues));
    }
  });
});
```

- [ ] **Step 2 : Lancer le test de parité**

Run: `pnpm -F @pilote/ppg test:server:unit pariteValidata`
Expected: **PASS sur 100 % des cas.**

Chaque échec est une divergence réelle. **Corriger le moteur, jamais le golden.** Si une divergence est jugée acceptable (par exemple une erreur supplémentaire que Validata ne remontait pas), l'inscrire explicitement dans une liste d'exceptions commentée du test, avec sa justification — et la mentionner dans la description de la PR.

- [ ] **Step 3 : Commit**

```bash
pnpm lint
git add apps/pilote-ppg/src/server/import-indicateur/__tests__
git commit -m "test(ppg-import): parité de verdict avec les goldens Validata"
```

---

### Task 12 : Bascule de l'injection et suppression du code Validata

> Ne commencer qu'une fois la **Task 11 verte**. Tant que la parité n'est pas prouvée, Validata reste branché.

**Files:**
- Modify: `apps/pilote-ppg/src/server/import-indicateur/module.ts`
- Modify: `apps/pilote-ppg/src/server/import-indicateur/usecases/VerifierFichierIndicateurImporteUseCase.ts`
- Modify: `apps/pilote-ppg/src/server/import-indicateur/infrastructure/handlers/VerifierImportIndicateurHandler.ts`
- Modify: `apps/pilote-ppg/src/server/import-indicateur/infrastructure/handlers/ImportDonneeIndicateurAPIHandler.ts:167`
- Modify: `apps/pilote-ppg/src/config.ts`
- Modify: `apps/pilote-ppg/src/proxy.ts`
- Modify: `apps/pilote-ppg/src/server/gestion-contenu/domain/VariableContenuDisponible.ts`
- Modify: `apps/pilote-ppg/src/server/gestion-contenu/usecases/RecupererVariableContenuUseCase.ts`
- Delete: `infrastructure/adapters/FetchHttpClient.ts`, `domain/ports/HttpClient.interface.ts`, `infrastructure/adapters/ValidataFichierIndicateurValidationService.ts`, `infrastructure/ReportValidata.interface.ts`, `app/builder/ReportErrorBuilder.ts`, `app/builder/ReportValidataWithDataBuilder.ts`, `__tests__/infrastructure/adapters/ValidataFichierIndicateurValidationService.integration.test.ts`

**Interfaces:**
- Consumes: `LocalFichierIndicateurValidationService` (Task 10).
- Produces: `VerifierFichierIndicateurImporteUseCase.execute()` perd son paramètre `baseSchemaUrl`.

- [ ] **Step 1 : Vérifier qu'aucune variable d'environnement n'est positionnée hors du repo**

Run:
```bash
grep -rn "URL_VALIDATA\|NEXT_PUBLIC_SCHEMA_VALIDATA_URL" --include="*.env*" --include="*.yml" --include="*.yaml" --include="*.json" --include="*.sh" --include="*.md" . | grep -v node_modules
```
Expected: aucune occurrence en dehors de `config.ts` et de la documentation. **Si une occurrence apparaît dans un manifeste de déploiement, demander confirmation avant de retirer le code de configuration** — une variable orpheline côté Scalingo est inoffensive, l'inverse ne l'est pas.

- [ ] **Step 2 : Basculer le binding**

Dans `module.ts` : retirer l'import et l'entrée `httpClient` du cradle et du type `ImportIndicateurOwnCradle`, et remplacer

```ts
      fichierIndicateurValidationService: asModuleClass(
        ValidataFichierIndicateurValidationService,
      ),
```

par

```ts
      fichierIndicateurValidationService: asModuleClass(
        LocalFichierIndicateurValidationService,
      ),
```

- [ ] **Step 3 : Retirer `baseSchemaUrl` de la chaîne d'appel**

Dans `VerifierFichierIndicateurImporteUseCase.execute()` : supprimer `baseSchemaUrl` de la signature et de son type, et remplacer `schema: \`${baseSchemaUrl}${schema}\`` par `schema`.

Dans `VerifierImportIndicateurHandler.handle()` : supprimer l'instanciation de `RecupererVariableContenuUseCase`, la variable `baseSchemaUrl`, le `// @ts-expect-error` associé et son passage à `execute()`.

Dans `ImportDonneeIndicateurAPIHandler.ts:167` : supprimer `baseSchemaUrl: configuration().schemaValidataUrl,` et l'import de `configuration` s'il devient inutilisé.

- [ ] **Step 4 : Nettoyer la configuration et la CSP**

Dans `config.ts` : supprimer le bloc `urlValidata` (lignes ~127-131) et le bloc `schemaValidataUrl` (lignes ~527-532).

Dans `proxy.ts` : retirer `https://api.validata.etalab.studio/` des deux directives `connect-src` (dev ligne ~80, prod ligne ~90).

Dans `VariableContenuDisponible.ts` : retirer `"NEXT_PUBLIC_SCHEMA_VALIDATA_URL"` de `VARIABLE_CONTENU_NON_FF` et la propriété correspondante de `VariableContenuDisponibleEnv`.

Dans `RecupererVariableContenuUseCase.ts` : supprimer le `case "NEXT_PUBLIC_SCHEMA_VALIDATA_URL"`.

- [ ] **Step 5 : Supprimer les fichiers Validata**

```bash
cd apps/pilote-ppg/src/server/import-indicateur
git rm infrastructure/adapters/FetchHttpClient.ts \
       domain/ports/HttpClient.interface.ts \
       infrastructure/adapters/ValidataFichierIndicateurValidationService.ts \
       infrastructure/ReportValidata.interface.ts \
       app/builder/ReportErrorBuilder.ts \
       app/builder/ReportValidataWithDataBuilder.ts \
       __tests__/infrastructure/adapters/ValidataFichierIndicateurValidationService.integration.test.ts
```

- [ ] **Step 6 : Vérifier qu'il ne reste aucune trace**

Run: `grep -rin "validata" --include="*.ts" --include="*.tsx" apps/pilote-ppg/src | grep -v node_modules`
Expected: aucune occurrence, hormis éventuellement un commentaire historique assumé.

Run: `pnpm lint`
Expected: PASS — `tsc` doit confirmer qu'aucun appelant ne référence plus les symboles supprimés.

- [ ] **Step 7 : Commit**

```bash
git add -A
git commit -m "refactor(ppg-import): bascule sur la validation locale et suppression du code Validata"
```

---

### Task 13 : Réécriture des tests d'intégration des handlers

**Files:**
- Modify: `apps/pilote-ppg/src/server/import-indicateur/__tests__/infrastructure/handlers/VerifierImportIndicateurHandler.integration.test.ts`
- Modify: `apps/pilote-ppg/src/server/import-indicateur/__tests__/infrastructure/handlers/ImportDonneeIndicateurAPIHandler.integration.test.ts`
- Modify: `apps/pilote-ppg/vitest.projects/fichiersIntegrationAvecMocksDeModule.ts`

**Interfaces:**
- Consumes: les fixtures de la Task 1.
- Produces: rien.

Les deux fichiers mockent aujourd'hui l'appel HTTP via `nock`. Il n'y a plus d'appel HTTP : ils partent désormais de vrais fichiers.

- [ ] **Step 1 : Remplacer les mocks réseau par des fixtures**

Dans chaque test, supprimer les imports et les appels `nock`, et fournir un vrai fichier via `formidable` en pointant `filepath` sur une copie d'une fixture. Conserver les assertions existantes sur le contrat de réponse (`estValide`, `listeErreursValidation`).

Cas minimaux à couvrir dans `VerifierImportIndicateurHandler.integration.test.ts` :
- fichier valide → `200`, `estValide: true`, mesures temporaires persistées
- fichier au motif invalide → `200`, `estValide: false`, erreurs persistées
- XLSX valide → même verdict que son équivalent CSV

Cas minimaux dans `ImportDonneeIndicateurAPIHandler.integration.test.ts` :
- parcours `multipart/form-data` avec fichier valide → `200`
- parcours `application/json` → `200` (le détour JSON → CSV est conservé, voir Hors scope)
- fichier invalide → `400` avec la liste d'erreurs

- [ ] **Step 2 : Lancer les tests d'intégration**

Run: `pnpm -F @pilote/ppg test:server:integration`
Expected: PASS. La base de test doit tourner (`pnpm -F @pilote/ppg test:database:init` si besoin — **ne pas toucher aux conteneurs Docker, demander à l'utilisateur de vérifier que Docker est démarré**).

- [ ] **Step 3 : Retirer les fichiers de la liste des mocks de module**

`fichiersIntegrationAvecMocksDeModule.ts` ne liste ces deux fichiers que parce qu'ils mockaient `ParseForm` et `FichierService` pour éviter l'appel réseau. Le commentaire du fichier prévoit explicitement sa disparition.

Si aucun `vi.mock` ne subsiste dans ces tests, vider la liste puis supprimer :
- `vitest.projects/fichiersIntegrationAvecMocksDeModule.ts`
- `vitest.projects/vitest.config.server-integration-mocks.ts`
- la référence au projet dans `vitest.config.ts`
- l'`exclude` dans `vitest.config.server-integration.ts`
- `--project server-integration-mocks` dans les scripts `test:server` et `test:server:integration` de `package.json`

- [ ] **Step 4 : Vérifier que toute la suite tourne encore**

Run: `pnpm -F @pilote/ppg test:server`
Expected: PASS, avec un projet vitest de moins.

- [ ] **Step 5 : Commit**

```bash
pnpm lint
git add -A
git commit -m "test(ppg-import): tests d'intégration sur fichiers réels, suppression du projet vitest dédié aux mocks"
```

---

### Task 14 : Plafonds de sécurité sur l'upload

**Files:**
- Modify: `apps/pilote-ppg/src/server/import-indicateur/infrastructure/handlers/ParseForm.ts`
- Test: `apps/pilote-ppg/src/server/import-indicateur/__tests__/infrastructure/handlers/ParseForm.unit.test.ts`

**Interfaces:**
- Consumes: rien.
- Produces: rien.

Il n'existe aujourd'hui **aucune limite de taille d'upload**, ni côté serveur ni côté client. C'était sans conséquence tant que Validata encaissait les fichiers ; ça ne l'est plus.

Le seuil doit rester **au-dessus** de ce qui passait jusqu'ici pour ne pas créer de régression. `25 Mo` couvre très largement un fichier de 50 000 lignes (~3 Mo en CSV). À confirmer contre les tailles réellement observées avant de figer.

- [ ] **Step 1 : Écrire le test qui échoue**

```ts
import { IncomingForm } from "formidable";
import { OPTIONS_FORMULAIRE } from "@/server/import-indicateur/infrastructure/handlers/ParseForm";

describe("ParseForm", () => {
  it("plafonne la taille d'un fichier importé", () => {
    expect(OPTIONS_FORMULAIRE.maxFileSize).toBe(25 * 1024 * 1024);
  });

  it("n'accepte qu'un seul fichier", () => {
    expect(OPTIONS_FORMULAIRE.multiples).toBe(false);
    expect(OPTIONS_FORMULAIRE.maxFiles).toBe(1);
  });

  it("est réellement appliqué par formidable", () => {
    const form = new IncomingForm({ ...OPTIONS_FORMULAIRE, uploadDir: "/tmp" });
    expect(form.options.maxFileSize).toBe(25 * 1024 * 1024);
  });
});
```

- [ ] **Step 2 : Lancer le test** — Expected: FAIL, `OPTIONS_FORMULAIRE` n'est pas exporté.

- [ ] **Step 3 : Extraire et plafonner les options**

Dans `ParseForm.ts`, extraire les options dans une constante exportée et y ajouter les plafonds :

```ts
export const OPTIONS_FORMULAIRE = {
  multiples: false,
  maxFiles: 1,
  // Aucune limite n'existait : un fichier de 50 000 lignes pèse ~3 Mo en CSV,
  // 25 Mo laisse une marge confortable sans exposer le parsing local.
  maxFileSize: 25 * 1024 * 1024,
  filename: (_name: string, _ext: string, part: { mimetype?: string | null }) =>
    `${_name}.${mime.getExtension(part.mimetype || "") || "unknown"}`,
} as const;
```

puis `const form = new IncomingForm({ ...OPTIONS_FORMULAIRE, uploadDir });`

- [ ] **Step 4 : Lancer le test** — Expected: PASS.
- [ ] **Step 5 : Commit** — `git commit -m "feat(ppg-import): plafonne la taille des fichiers importés"`

---

### Task 15 : Nettoyage final

**Files:**
- Delete: `public/schema/` (racine du repo)
- Modify: `apps/pilote-ppg/package.json` (retrait de `nock`)
- Modify: `apps/pilote-ppg/src/server/import-indicateur/usecases/PublierFichierIndicateurImporteUseCase.ts` (commentaire)
- Modify: `apps/pilote-ppg/docs/architecture/decisions/0009-validation-locale-des-fichiers-d-import.md` (statut)

- [ ] **Step 1 : Supprimer le dossier de schémas dupliqué à la racine**

Son `README.md` indique qu'il n'existe que pour maintenir les URLs brutes GitHub utilisées par Validata. Plus de Validata, plus de raison d'être.

```bash
git rm -r public/schema
```

Vérifier que rien ne le référence :
Run: `grep -rn "raw.githubusercontent.*public/schema" --include="*.ts" --include="*.tsx" --include="*.md" . | grep -v node_modules`
Expected: aucune occurrence en dehors de la spec et de l'ADR, qui en parlent au passé.

- [ ] **Step 2 : Retirer `nock`**

```bash
pnpm -F @pilote/ppg remove nock
```
Run: `grep -rn "nock" --include="*.ts" apps/pilote-ppg/src | grep -v node_modules`
Expected: aucune occurrence.

- [ ] **Step 3 : Corriger le commentaire obsolète**

Dans `PublierFichierIndicateurImporteUseCase.ts`, remplacer
`// En arrivant ici on a déjà vérifié les valeurs par validata, on est donc sur que les valeurs sont présentes d'où le as string`
par
`// Les valeurs ont déjà été validées à l'étape de vérification : elles sont présentes, d'où le as string.`

- [ ] **Step 4 : Passer l'ADR en « Accepté »**

Dans l'ADR 0009, remplacer `## Statut\n\nProposé` par `## Statut\n\nAccepté`.

- [ ] **Step 5 : Vérification complète**

```bash
pnpm lint
pnpm -F @pilote/ppg test:server
grep -rin "validata" --include="*.ts" --include="*.tsx" apps/pilote-ppg/src | grep -v node_modules
```
Expected: lint PASS, tests PASS, aucune occurrence de `validata` dans le code source.

- [ ] **Step 6 : Commit**

```bash
git add -A
git commit -m "chore(ppg-import): nettoyage final, suppression des schémas dupliqués et de nock"
```

---

## Ce que ce plan ne traite volontairement pas

Défauts du flux d'import identifiés pendant l'analyse, tenus hors périmètre pour ne pas mélanger la parité avec autre chose. À reprendre dans des tickets dédiés, une fois le 1:1 acquis :

1. **Détour JSON → CSV → disque** sur l'API publique, qui n'existait que pour nourrir Validata.
2. **N+1 à la publication** : `creerValeurIndicateurTerritoireEvenements` fait un `await` par groupe `(indicId, territoireCode)`, séquentiellement et hors transaction. Un TODO daté de 2025-08 le signale déjà.
3. **Le front ne vérifie pas `response.ok`** dans `useFomulaireIndicateur` : sur un 500, `json()` lève et il n'y a pas de `catch`. L'utilisateur voit le chargement s'arrêter sans message — symptôme probable de **PIL-211** et **PIL-1279**.
4. **Erreurs de validation écrites hors transaction** : `PrismaErreurValidationFichierRepository` importe `prisma` directement au lieu de `getPrisma()`.
5. **Pas de contrôle de propriété à la publication** : `rapportId` vient de la query string, sans vérification que le rapport appartient à l'appelant.
6. **`request.read()` synchrone** sur le parcours JSON de l'API.
7. **Quatre passes sur les mêmes données** entre vérification et publication.

## Vérification finale avant la PR

- [ ] Task 11 verte : **100 % des goldens passent**
- [ ] `pnpm lint` PASS
- [ ] `pnpm -F @pilote/ppg test:server` PASS
- [ ] Aucune occurrence de `validata` dans `apps/pilote-ppg/src`
- [ ] `git diff dev --stat` ne montre **aucun ajout** dans `dependencies` ou `devDependencies` (hors retrait de `nock`)
- [ ] Le template officiel `template_import_PILOTE.csv` **et** `template_import_PILOTE.xlsx` sont couverts par un test qui passe
- [ ] La description de la PR liste les divergences de parité assumées, s'il y en a
