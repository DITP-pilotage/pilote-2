# Validation locale du fichier d'import d'indicateur — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer la dépendance à l'API tierce Validata (Etalab) par un parsing (CSV/XLSX) et une validation de schéma 100% locaux pour l'import de données d'indicateur, sans changer le comportement observable pour l'utilisateur final.

**Architecture:** Un nouvel adapter `LocalFichierIndicateurValidationService` (implémentant le port existant `FichierIndicateurValidationService`) orchestre trois modules purs et isolés : `SchemaRepository` (lecture des schémas JSON déjà présents dans `public/schema/`), `FichierParser` (CSV/XLSX → lignes), `TableSchemaValidator` (lignes + schéma → violations de contraintes). Un module séparé `genererMessageErreur` traduit chaque violation en message FR. L'ancien adapter HTTP (`FetchHttpClient`, `ValidataFichierIndicateurValidationService`) et le port `HttpClient` sont supprimés.

**Tech Stack:** TypeScript, Vitest, `csv-parse` (déjà présent), `exceljs` (nouvelle dépendance), Awilix (DI).

**Spec:** `docs/superpowers/specs/2026-08-31-validation-locale-import-indicateur-design.md`

## Global Constraints

- Toutes les nouvelles unités de logique pure (`SchemaRepository`, `FichierParser`, `TableSchemaValidator`, `genererMessageErreur`) vivent dans `apps/pilote-ppg/src/server/import-indicateur/infrastructure/adapters/validation-fichier/` et sont testées en `.unit.test.ts` (aucune dépendance DB/réseau).
- **Ne jamais lancer les tests soi-même.** Chaque étape "Run test" de ce plan doit être exécutée en demandant explicitement à l'utilisateur de lancer la commande indiquée et de partager le résultat (stdout/erreur) avant de continuer.
- Tous les chemins de fichiers ci-dessous sont relatifs à `apps/pilote-ppg/` (racine du package Next.js), sauf mention contraire. Le dépôt git racine est un niveau au-dessus (`/Users/tristanconti/Documents/pilote-2`).
- Convention de numérotation des lignes dans les messages/erreurs : pour une ligne de données d'index 0-based `i` (après l'en-tête), la ligne "humaine" affichée = `i + 2` (l'en-tête compte pour la ligne 1, comme dans un tableur). `numeroDeLigne` = cette valeur ; `positionDeLigne` = `i` (0-based).
- Style de code : French domain naming (comme le reste du repo), pas de commentaires sauf si un WHY non-évident le justifie, `toEqual`/`toStrictEqual` plutôt que `toHaveLength` + accès indexé quand la valeur complète est connue.
- Commits : un commit par tâche, jamais de commit sans que l'étape "Commit" du plan le prévoie explicitement (l'utilisateur peut vouloir ajuster avant).

---

### Task 1: Types du schéma de table + `SchemaRepository`

**Files:**
- Create: `src/server/import-indicateur/infrastructure/adapters/validation-fichier/TableSchema.types.ts`
- Create: `src/server/import-indicateur/infrastructure/adapters/validation-fichier/SchemaRepository.ts`
- Test: `src/server/import-indicateur/__tests__/infrastructure/adapters/validation-fichier/SchemaRepository.unit.test.ts`

**Interfaces:**
- Produces: `TableSchema`, `TableSchemaField`, `TableSchemaFieldConstraints` (types), `chargerSchema(nomFichier: string): TableSchema` (fonction).

- [ ] **Step 1: Écrire le test**

```ts
import { chargerSchema } from "@/server/import-indicateur/infrastructure/adapters/validation-fichier/SchemaRepository";

describe("chargerSchema", () => {
  it("doit charger le schéma sans-contraintes.json et exposer ses champs et sa clé primaire", () => {
    const schema = chargerSchema("sans-contraintes.json");

    expect(schema.fields.map((champ) => champ.name)).toEqual([
      "identifiant_indic",
      "zone_id",
      "date_valeur",
      "type_valeur",
      "valeur",
    ]);
    expect(schema.primaryKey).toEqual([
      "identifiant_indic",
      "zone_id",
      "date_valeur",
      "type_valeur",
    ]);
  });

  it("doit lever une erreur quand le fichier de schéma n'existe pas", () => {
    expect(() => chargerSchema("inexistant.json")).toThrow();
  });
});
```

- [ ] **Step 2: Demander à l'utilisateur de lancer le test et vérifier qu'il échoue**

Commande : `pnpm test:server:unit -- src/server/import-indicateur/__tests__/infrastructure/adapters/validation-fichier/SchemaRepository.unit.test.ts`
Attendu : FAIL — le module `SchemaRepository` n'existe pas encore.

- [ ] **Step 3: Créer les types**

```ts
// TableSchema.types.ts
export type TableSchemaFieldType = "string" | "number";

export type TableSchemaFieldConstraints = {
  required?: boolean;
  pattern?: string;
  enum?: string[];
  minimum?: number;
  maximum?: number;
};

export type TableSchemaField = {
  name: string;
  type: TableSchemaFieldType;
  constraints?: TableSchemaFieldConstraints;
};

export type TableSchema = {
  fields: TableSchemaField[];
  primaryKey: string[];
};

export type TypeViolation =
  | "required"
  | "pattern"
  | "enum"
  | "type"
  | "minimum"
  | "maximum"
  | "primaryKey-duplicate"
  | "primaryKey-vide";

export type ViolationContrainte = {
  type: TypeViolation;
  nomDuChamp: string;
  cellule: string;
  ligneDeDonnees: number;
};
```

- [ ] **Step 4: Implémenter `SchemaRepository`**

```ts
// SchemaRepository.ts
import fs from "node:fs";
import path from "node:path";
import { TableSchema } from "@/server/import-indicateur/infrastructure/adapters/validation-fichier/TableSchema.types";

export function chargerSchema(nomFichier: string): TableSchema {
  const cheminSchema = path.join(process.cwd(), "public", "schema", nomFichier);
  const contenu = fs.readFileSync(cheminSchema, "utf-8");

  return JSON.parse(contenu) as TableSchema;
}
```

- [ ] **Step 5: Demander à l'utilisateur de relancer le test et vérifier qu'il passe**

Commande : `pnpm test:server:unit -- src/server/import-indicateur/__tests__/infrastructure/adapters/validation-fichier/SchemaRepository.unit.test.ts`
Attendu : PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
cd /Users/tristanconti/Documents/pilote-2
git add apps/pilote-ppg/src/server/import-indicateur/infrastructure/adapters/validation-fichier/TableSchema.types.ts \
        apps/pilote-ppg/src/server/import-indicateur/infrastructure/adapters/validation-fichier/SchemaRepository.ts \
        apps/pilote-ppg/src/server/import-indicateur/__tests__/infrastructure/adapters/validation-fichier/SchemaRepository.unit.test.ts
git commit -m "feat(ppg-import): ajoute SchemaRepository pour charger les schémas Table Schema en local"
```

---

### Task 2: `FichierParser` — support CSV

**Files:**
- Create: `src/server/import-indicateur/infrastructure/adapters/validation-fichier/FichierParser.ts`
- Test: `src/server/import-indicateur/__tests__/infrastructure/adapters/validation-fichier/FichierParser.unit.test.ts`

**Interfaces:**
- Consumes: rien (module autonome).
- Produces: `parserFichier(cheminCompletDuFichier: string, nomDuFichier: string): Promise<string[][]>` — la ligne 0 est l'en-tête.

- [ ] **Step 1: Écrire le test**

```ts
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { parserFichier } from "@/server/import-indicateur/infrastructure/adapters/validation-fichier/FichierParser";

describe("parserFichier", () => {
  describe("quand le fichier est un CSV", () => {
    it("doit parser les en-têtes et les lignes de données", async () => {
      const cheminFichier = path.join(os.tmpdir(), `fichier-test-${Date.now()}.csv`);
      fs.writeFileSync(
        cheminFichier,
        "identifiant_indic,zone_id,date_valeur,type_valeur,valeur\nIND-001,D001,2023-01-31,vi,9\n",
      );

      const lignes = await parserFichier(cheminFichier, "fichier.csv");

      expect(lignes).toEqual([
        ["identifiant_indic", "zone_id", "date_valeur", "type_valeur", "valeur"],
        ["IND-001", "D001", "2023-01-31", "vi", "9"],
      ]);

      fs.unlinkSync(cheminFichier);
    });
  });

  describe("quand le format du fichier n'est pas supporté", () => {
    it("doit lever une erreur", async () => {
      await expect(parserFichier("chemin", "fichier.txt")).rejects.toThrow(
        "Format de fichier non supporté : .txt",
      );
    });
  });
});
```

- [ ] **Step 2: Demander à l'utilisateur de lancer le test et vérifier qu'il échoue**

Commande : `pnpm test:server:unit -- src/server/import-indicateur/__tests__/infrastructure/adapters/validation-fichier/FichierParser.unit.test.ts`
Attendu : FAIL — le module `FichierParser` n'existe pas encore.

- [ ] **Step 3: Implémenter le support CSV**

```ts
// FichierParser.ts
import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";

export async function parserFichier(
  cheminCompletDuFichier: string,
  nomDuFichier: string,
): Promise<string[][]> {
  const extension = path.extname(nomDuFichier).toLowerCase();

  if (extension === ".csv") {
    const contenu = fs.readFileSync(cheminCompletDuFichier, "utf-8");
    return parse(contenu, {
      columns: false,
      skipEmptyLines: true,
      trim: true,
    }) as string[][];
  }

  throw new Error(`Format de fichier non supporté : ${extension}`);
}
```

- [ ] **Step 4: Demander à l'utilisateur de relancer le test et vérifier qu'il passe**

Commande : `pnpm test:server:unit -- src/server/import-indicateur/__tests__/infrastructure/adapters/validation-fichier/FichierParser.unit.test.ts`
Attendu : PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
cd /Users/tristanconti/Documents/pilote-2
git add apps/pilote-ppg/src/server/import-indicateur/infrastructure/adapters/validation-fichier/FichierParser.ts \
        apps/pilote-ppg/src/server/import-indicateur/__tests__/infrastructure/adapters/validation-fichier/FichierParser.unit.test.ts
git commit -m "feat(ppg-import): ajoute le parsing CSV local du fichier d'import"
```

---

### Task 3: `FichierParser` — support XLSX

**Files:**
- Modify: `package.json` (ajout de la dépendance `exceljs`)
- Modify: `src/server/import-indicateur/infrastructure/adapters/validation-fichier/FichierParser.ts`
- Modify: `src/server/import-indicateur/__tests__/infrastructure/adapters/validation-fichier/FichierParser.unit.test.ts`

**Interfaces:**
- Consumes: `parserFichier` (Task 2, même signature, étendue au `.xlsx`).
- Produces: rien de nouveau en dehors du module.

- [ ] **Step 1: Ajouter la dépendance**

```bash
cd /Users/tristanconti/Documents/pilote-2/apps/pilote-ppg
pnpm add exceljs
```

- [ ] **Step 2: Écrire le test XLSX**

Ajouter dans `FichierParser.unit.test.ts`, à côté du describe CSV existant :

```ts
import ExcelJS from "exceljs";

// ... (imports existants conservés)

describe("quand le fichier est un XLSX", () => {
  it("doit parser les en-têtes et les lignes de données", async () => {
    const cheminFichier = path.join(os.tmpdir(), `fichier-test-${Date.now()}.xlsx`);
    const workbook = new ExcelJS.Workbook();
    const feuille = workbook.addWorksheet("Feuille1");
    feuille.addRow(["identifiant_indic", "zone_id", "date_valeur", "type_valeur", "valeur"]);
    feuille.addRow(["IND-001", "D001", "2023-01-31", "vi", 9]);
    await workbook.xlsx.writeFile(cheminFichier);

    const lignes = await parserFichier(cheminFichier, "fichier.xlsx");

    expect(lignes).toEqual([
      ["identifiant_indic", "zone_id", "date_valeur", "type_valeur", "valeur"],
      ["IND-001", "D001", "2023-01-31", "vi", "9"],
    ]);

    fs.unlinkSync(cheminFichier);
  });

  it("doit convertir une cellule de type Date au format AAAA-MM-JJ", async () => {
    const cheminFichier = path.join(os.tmpdir(), `fichier-test-${Date.now()}.xlsx`);
    const workbook = new ExcelJS.Workbook();
    const feuille = workbook.addWorksheet("Feuille1");
    feuille.addRow(["identifiant_indic", "zone_id", "date_valeur", "type_valeur", "valeur"]);
    feuille.addRow(["IND-001", "D001", new Date(Date.UTC(2023, 0, 31)), "vi", 9]);
    await workbook.xlsx.writeFile(cheminFichier);

    const lignes = await parserFichier(cheminFichier, "fichier.xlsx");

    expect(lignes[1][2]).toEqual("2023-01-31");

    fs.unlinkSync(cheminFichier);
  });
});
```

- [ ] **Step 3: Demander à l'utilisateur de lancer le test et vérifier qu'il échoue**

Commande : `pnpm test:server:unit -- src/server/import-indicateur/__tests__/infrastructure/adapters/validation-fichier/FichierParser.unit.test.ts`
Attendu : FAIL sur les 2 nouveaux tests — le format `.xlsx` n'est pas encore géré.

- [ ] **Step 4: Implémenter le support XLSX**

Ajouter dans `FichierParser.ts` :

```ts
import ExcelJS from "exceljs";

function convertirCelluleEnTexte(valeur: ExcelJS.CellValue): string {
  if (valeur === null || valeur === undefined) {
    return "";
  }
  if (valeur instanceof Date) {
    return valeur.toISOString().split("T")[0];
  }
  return String(valeur).trim();
}

async function parserXlsx(cheminCompletDuFichier: string): Promise<string[][]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(cheminCompletDuFichier);
  const feuille = workbook.worksheets[0];
  const lignes: string[][] = [];

  feuille.eachRow({ includeEmpty: false }, (row) => {
    const valeurs = (row.values as ExcelJS.CellValue[]).slice(1);
    lignes.push(valeurs.map(convertirCelluleEnTexte));
  });

  return lignes;
}
```

Et dans `parserFichier`, ajouter avant le `throw` final :

```ts
  if (extension === ".xlsx") {
    return parserXlsx(cheminCompletDuFichier);
  }
```

- [ ] **Step 5: Demander à l'utilisateur de relancer le test et vérifier qu'il passe**

Commande : `pnpm test:server:unit -- src/server/import-indicateur/__tests__/infrastructure/adapters/validation-fichier/FichierParser.unit.test.ts`
Attendu : PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
cd /Users/tristanconti/Documents/pilote-2
git add apps/pilote-ppg/package.json apps/pilote-ppg/pnpm-lock.yaml \
        apps/pilote-ppg/src/server/import-indicateur/infrastructure/adapters/validation-fichier/FichierParser.ts \
        apps/pilote-ppg/src/server/import-indicateur/__tests__/infrastructure/adapters/validation-fichier/FichierParser.unit.test.ts
git commit -m "feat(ppg-import): ajoute le parsing XLSX local du fichier d'import"
```

---

### Task 4: `TableSchemaValidator` — contraintes de champ

**Files:**
- Create: `src/server/import-indicateur/infrastructure/adapters/validation-fichier/TableSchemaValidator.ts`
- Create: `src/server/import-indicateur/__tests__/infrastructure/adapters/validation-fichier/TableSchemaValidator.unit.test.ts`

**Interfaces:**
- Consumes: `TableSchema`, `ViolationContrainte` (Task 1).
- Produces: `validerContraintesDeChamp(schema: TableSchema, entetes: string[], lignesDeDonnees: string[][]): ViolationContrainte[]`.

- [ ] **Step 1: Écrire les tests**

```ts
import { validerContraintesDeChamp } from "@/server/import-indicateur/infrastructure/adapters/validation-fichier/TableSchemaValidator";
import { TableSchema } from "@/server/import-indicateur/infrastructure/adapters/validation-fichier/TableSchema.types";

export const SCHEMA_DE_TEST: TableSchema = {
  fields: [
    { name: "identifiant_indic", type: "string", constraints: { required: true, pattern: "^IND-([0-9]{3,4})$" } },
    { name: "zone_id", type: "string", constraints: { required: true, pattern: "^(D[0-9]{2}|R[0-9]{2})$" } },
    { name: "date_valeur", type: "string", constraints: { required: true } },
    { name: "type_valeur", type: "string", constraints: { required: true, enum: ["vi", "va", "vc"] } },
    { name: "valeur", type: "number", constraints: { required: false, minimum: 0, maximum: 100 } },
  ],
  primaryKey: ["identifiant_indic", "zone_id", "date_valeur", "type_valeur"],
};

export const ENTETES_DE_TEST = [
  "identifiant_indic",
  "zone_id",
  "date_valeur",
  "type_valeur",
  "valeur",
];

describe("validerContraintesDeChamp", () => {
  it("ne doit remonter aucune violation pour une ligne valide", () => {
    const violations = validerContraintesDeChamp(SCHEMA_DE_TEST, ENTETES_DE_TEST, [
      ["IND-001", "D001", "2023-01-31", "vi", "9"],
    ]);
    expect(violations).toEqual([]);
  });

  it("doit remonter une violation 'required' quand un champ obligatoire est vide", () => {
    const violations = validerContraintesDeChamp(SCHEMA_DE_TEST, ENTETES_DE_TEST, [
      ["", "D001", "2023-01-31", "vi", "9"],
    ]);
    expect(violations).toEqual([
      { type: "required", nomDuChamp: "identifiant_indic", cellule: "", ligneDeDonnees: 0 },
    ]);
  });

  it("doit remonter une violation 'pattern' quand la valeur ne respecte pas le format", () => {
    const violations = validerContraintesDeChamp(SCHEMA_DE_TEST, ENTETES_DE_TEST, [
      ["INVALIDE", "D001", "2023-01-31", "vi", "9"],
    ]);
    expect(violations).toEqual([
      { type: "pattern", nomDuChamp: "identifiant_indic", cellule: "INVALIDE", ligneDeDonnees: 0 },
    ]);
  });

  it("doit remonter une violation 'enum' quand la valeur n'est pas autorisée", () => {
    const violations = validerContraintesDeChamp(SCHEMA_DE_TEST, ENTETES_DE_TEST, [
      ["IND-001", "D001", "2023-01-31", "invalide", "9"],
    ]);
    expect(violations).toEqual([
      { type: "enum", nomDuChamp: "type_valeur", cellule: "invalide", ligneDeDonnees: 0 },
    ]);
  });

  it("doit remonter une violation 'type' quand un champ nombre n'est pas numérique", () => {
    const violations = validerContraintesDeChamp(SCHEMA_DE_TEST, ENTETES_DE_TEST, [
      ["IND-001", "D001", "2023-01-31", "vi", "abc"],
    ]);
    expect(violations).toEqual([
      { type: "type", nomDuChamp: "valeur", cellule: "abc", ligneDeDonnees: 0 },
    ]);
  });

  it("doit remonter une violation 'maximum' quand la valeur dépasse le plafond", () => {
    const violations = validerContraintesDeChamp(SCHEMA_DE_TEST, ENTETES_DE_TEST, [
      ["IND-001", "D001", "2023-01-31", "vi", "150"],
    ]);
    expect(violations).toEqual([
      { type: "maximum", nomDuChamp: "valeur", cellule: "150", ligneDeDonnees: 0 },
    ]);
  });

  it("ne doit pas remonter de violation quand un champ non obligatoire est vide", () => {
    const violations = validerContraintesDeChamp(SCHEMA_DE_TEST, ENTETES_DE_TEST, [
      ["IND-001", "D001", "2023-01-31", "vi", ""],
    ]);
    expect(violations).toEqual([]);
  });
});
```

- [ ] **Step 2: Demander à l'utilisateur de lancer le test et vérifier qu'il échoue**

Commande : `pnpm test:server:unit -- src/server/import-indicateur/__tests__/infrastructure/adapters/validation-fichier/TableSchemaValidator.unit.test.ts`
Attendu : FAIL — le module `TableSchemaValidator` n'existe pas encore.

- [ ] **Step 3: Implémenter**

```ts
// TableSchemaValidator.ts
import {
  TableSchema,
  ViolationContrainte,
} from "@/server/import-indicateur/infrastructure/adapters/validation-fichier/TableSchema.types";

const REGEX_NOMBRE = /^-?\d+(\.\d+)?$/;

export function validerContraintesDeChamp(
  schema: TableSchema,
  entetes: string[],
  lignesDeDonnees: string[][],
): ViolationContrainte[] {
  const violations: ViolationContrainte[] = [];

  schema.fields.forEach((champ) => {
    const indexColonne = entetes.indexOf(champ.name);

    lignesDeDonnees.forEach((ligne, ligneDeDonnees) => {
      const cellule = (ligne[indexColonne] ?? "").trim();
      const estVide = cellule === "";

      if (champ.constraints?.required && estVide) {
        violations.push({ type: "required", nomDuChamp: champ.name, cellule, ligneDeDonnees });
        return;
      }

      if (estVide) {
        return;
      }

      if (champ.constraints?.pattern && !new RegExp(champ.constraints.pattern).test(cellule)) {
        violations.push({ type: "pattern", nomDuChamp: champ.name, cellule, ligneDeDonnees });
      }

      if (champ.constraints?.enum && !champ.constraints.enum.includes(cellule)) {
        violations.push({ type: "enum", nomDuChamp: champ.name, cellule, ligneDeDonnees });
      }

      if (champ.type === "number") {
        if (!REGEX_NOMBRE.test(cellule)) {
          violations.push({ type: "type", nomDuChamp: champ.name, cellule, ligneDeDonnees });
          return;
        }
        const valeurNumerique = Number(cellule);
        if (
          champ.constraints?.minimum !== undefined &&
          valeurNumerique < champ.constraints.minimum
        ) {
          violations.push({ type: "minimum", nomDuChamp: champ.name, cellule, ligneDeDonnees });
        }
        if (
          champ.constraints?.maximum !== undefined &&
          valeurNumerique > champ.constraints.maximum
        ) {
          violations.push({ type: "maximum", nomDuChamp: champ.name, cellule, ligneDeDonnees });
        }
      }
    });
  });

  return violations;
}
```

- [ ] **Step 4: Demander à l'utilisateur de relancer le test et vérifier qu'il passe**

Commande : `pnpm test:server:unit -- src/server/import-indicateur/__tests__/infrastructure/adapters/validation-fichier/TableSchemaValidator.unit.test.ts`
Attendu : PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
cd /Users/tristanconti/Documents/pilote-2
git add apps/pilote-ppg/src/server/import-indicateur/infrastructure/adapters/validation-fichier/TableSchemaValidator.ts \
        apps/pilote-ppg/src/server/import-indicateur/__tests__/infrastructure/adapters/validation-fichier/TableSchemaValidator.unit.test.ts
git commit -m "feat(ppg-import): ajoute la validation des contraintes de champ (required/pattern/enum/min/max)"
```

---

### Task 5: `TableSchemaValidator` — clé primaire

**Files:**
- Modify: `src/server/import-indicateur/infrastructure/adapters/validation-fichier/TableSchemaValidator.ts`
- Modify: `src/server/import-indicateur/__tests__/infrastructure/adapters/validation-fichier/TableSchemaValidator.unit.test.ts`

**Interfaces:**
- Consumes: `SCHEMA_DE_TEST`, `ENTETES_DE_TEST` (Task 4, même fichier de test).
- Produces: `detecterViolationsClePrimaire(schema: TableSchema, entetes: string[], lignesDeDonnees: string[][]): ViolationContrainte[]`.

- [ ] **Step 1: Ajouter les tests**

Ajouter dans `TableSchemaValidator.unit.test.ts`, après le describe existant :

```ts
import { detecterViolationsClePrimaire } from "@/server/import-indicateur/infrastructure/adapters/validation-fichier/TableSchemaValidator";

describe("detecterViolationsClePrimaire", () => {
  it("ne doit remonter aucune violation quand toutes les clés sont uniques", () => {
    const violations = detecterViolationsClePrimaire(SCHEMA_DE_TEST, ENTETES_DE_TEST, [
      ["IND-001", "D001", "2023-01-31", "vi", "9"],
      ["IND-001", "D001", "2023-01-31", "vc", "3"],
    ]);
    expect(violations).toEqual([]);
  });

  it("doit remonter une violation 'primaryKey-duplicate' pour la seconde ligne ayant la même clé", () => {
    const violations = detecterViolationsClePrimaire(SCHEMA_DE_TEST, ENTETES_DE_TEST, [
      ["IND-001", "D001", "2023-01-31", "vi", "9"],
      ["IND-001", "D001", "2023-01-31", "vi", "3"],
    ]);
    expect(violations).toEqual([
      {
        type: "primaryKey-duplicate",
        nomDuChamp: "identifiant_indic, zone_id, date_valeur, type_valeur",
        cellule: "",
        ligneDeDonnees: 1,
      },
    ]);
  });

  it("doit remonter une violation 'primaryKey-vide' quand toutes les cellules de la clé sont vides", () => {
    const violations = detecterViolationsClePrimaire(SCHEMA_DE_TEST, ENTETES_DE_TEST, [
      ["", "", "", "", ""],
    ]);
    expect(violations).toEqual([
      {
        type: "primaryKey-vide",
        nomDuChamp: "identifiant_indic, zone_id, date_valeur, type_valeur",
        cellule: "",
        ligneDeDonnees: 0,
      },
    ]);
  });
});
```

- [ ] **Step 2: Demander à l'utilisateur de lancer le test et vérifier qu'il échoue**

Commande : `pnpm test:server:unit -- src/server/import-indicateur/__tests__/infrastructure/adapters/validation-fichier/TableSchemaValidator.unit.test.ts`
Attendu : FAIL sur les 3 nouveaux tests — `detecterViolationsClePrimaire` n'existe pas encore.

- [ ] **Step 3: Implémenter**

Ajouter dans `TableSchemaValidator.ts` :

```ts
export function detecterViolationsClePrimaire(
  schema: TableSchema,
  entetes: string[],
  lignesDeDonnees: string[][],
): ViolationContrainte[] {
  const violations: ViolationContrainte[] = [];
  const indexColonnesCle = schema.primaryKey.map((nomChamp) => entetes.indexOf(nomChamp));
  const nomDuChamp = schema.primaryKey.join(", ");
  const clesVues = new Set<string>();

  lignesDeDonnees.forEach((ligne, ligneDeDonnees) => {
    const valeursCle = indexColonnesCle.map((index) => (ligne[index] ?? "").trim());
    const cleEstVide = valeursCle.every((valeur) => valeur === "");
    const cle = valeursCle.join("␟");

    if (cleEstVide || clesVues.has(cle)) {
      violations.push({
        type: cleEstVide ? "primaryKey-vide" : "primaryKey-duplicate",
        nomDuChamp,
        cellule: "",
        ligneDeDonnees,
      });
      return;
    }

    clesVues.add(cle);
  });

  return violations;
}
```

- [ ] **Step 4: Demander à l'utilisateur de relancer le test et vérifier qu'il passe**

Commande : `pnpm test:server:unit -- src/server/import-indicateur/__tests__/infrastructure/adapters/validation-fichier/TableSchemaValidator.unit.test.ts`
Attendu : PASS (10 tests).

- [ ] **Step 5: Commit**

```bash
cd /Users/tristanconti/Documents/pilote-2
git add apps/pilote-ppg/src/server/import-indicateur/infrastructure/adapters/validation-fichier/TableSchemaValidator.ts \
        apps/pilote-ppg/src/server/import-indicateur/__tests__/infrastructure/adapters/validation-fichier/TableSchemaValidator.unit.test.ts
git commit -m "feat(ppg-import): ajoute la détection des doublons/lignes vides de clé primaire"
```

---

### Task 6: Catalogue de messages FR (`genererMessageErreur`)

**Files:**
- Create: `src/server/import-indicateur/infrastructure/adapters/validation-fichier/genererMessageErreur.ts`
- Create: `src/server/import-indicateur/__tests__/infrastructure/adapters/validation-fichier/genererMessageErreur.unit.test.ts`

**Interfaces:**
- Consumes: `ViolationContrainte`, `TableSchema` (Task 1).
- Produces: `genererMessageErreur(violation: ViolationContrainte, schema: TableSchema): string`.

- [ ] **Step 1: Écrire les tests**

```ts
import { genererMessageErreur } from "@/server/import-indicateur/infrastructure/adapters/validation-fichier/genererMessageErreur";
import { TableSchema, ViolationContrainte } from "@/server/import-indicateur/infrastructure/adapters/validation-fichier/TableSchema.types";

const SCHEMA: TableSchema = {
  fields: [
    { name: "identifiant_indic", type: "string", constraints: { required: true, pattern: "^IND-([0-9]{3,4})$" } },
    { name: "zone_id", type: "string", constraints: { required: true, pattern: "^(D[0-9]{2}|R[0-9]{2})$" } },
    { name: "date_valeur", type: "string", constraints: { required: true, pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}$" } },
    { name: "type_valeur", type: "string", constraints: { required: true, enum: ["vi", "va", "vc"] } },
    { name: "valeur", type: "number", constraints: { required: false, minimum: 0, maximum: 100 } },
  ],
  primaryKey: ["identifiant_indic", "zone_id", "date_valeur", "type_valeur"],
};

describe("genererMessageErreur", () => {
  it.each<[ViolationContrainte, string]>([
    [
      { type: "required", nomDuChamp: "identifiant_indic", cellule: "", ligneDeDonnees: 0 },
      "Un indicateur ne peut etre vide. C'est le cas à la ligne 2.",
    ],
    [
      { type: "pattern", nomDuChamp: "identifiant_indic", cellule: "ABC", ligneDeDonnees: 3 },
      "L'identifiant de l'indicateur doit être renseigné dans le format IND-XXX. Vous pouvez vous référer au guide des indicateurs pour trouver l'identifiant de votre indicateur.",
    ],
    [
      { type: "pattern", nomDuChamp: "zone_id", cellule: "F001", ligneDeDonnees: 0 },
      "La zone renseignée 'F001' n'est pas une zone valide pour ce schéma d'import (ligne 2).",
    ],
    [
      { type: "pattern", nomDuChamp: "date_valeur", cellule: "31-12-2023", ligneDeDonnees: 0 },
      "La date '31-12-2023' n'est pas dans un format valide (AAAA-MM-JJ ou JJ/MM/AAAA), ligne 2.",
    ],
    [
      { type: "enum", nomDuChamp: "type_valeur", cellule: "xx", ligneDeDonnees: 0 },
      "Le type de valeur doit être vi (valeur initiale), va (valeur d'avancement) ou vc (valeur cible).",
    ],
    [
      { type: "type", nomDuChamp: "valeur", cellule: "abc", ligneDeDonnees: 0 },
      "La valeur 'abc' n'est pas un nombre valide (ligne 2).",
    ],
    [
      { type: "maximum", nomDuChamp: "valeur", cellule: "150", ligneDeDonnees: 0 },
      "La valeur '150' doit être inférieure ou égale à 100 (ligne 2).",
    ],
    [
      { type: "minimum", nomDuChamp: "valeur", cellule: "-5", ligneDeDonnees: 0 },
      "La valeur '-5' doit être supérieure ou égale à 0 (ligne 2).",
    ],
    [
      {
        type: "primaryKey-duplicate",
        nomDuChamp: "identifiant_indic, zone_id, date_valeur, type_valeur",
        cellule: "",
        ligneDeDonnees: 1,
      },
      "La ligne 3 est vide ou comporte les mêmes zone, date, identifiant d'indicateur et type de valeur qu'une autre ligne. Veuillez la modifier ou la supprimer.",
    ],
    [
      {
        type: "primaryKey-vide",
        nomDuChamp: "identifiant_indic, zone_id, date_valeur, type_valeur",
        cellule: "",
        ligneDeDonnees: 2,
      },
      "La ligne 4 est vide ou comporte les mêmes zone, date, identifiant d'indicateur et type de valeur qu'une autre ligne. Veuillez la modifier ou la supprimer.",
    ],
  ])("pour la violation %o, doit générer le message attendu", (violation, messageAttendu) => {
    expect(genererMessageErreur(violation, SCHEMA)).toEqual(messageAttendu);
  });
});
```

- [ ] **Step 2: Demander à l'utilisateur de lancer le test et vérifier qu'il échoue**

Commande : `pnpm test:server:unit -- src/server/import-indicateur/__tests__/infrastructure/adapters/validation-fichier/genererMessageErreur.unit.test.ts`
Attendu : FAIL — le module n'existe pas encore.

- [ ] **Step 3: Implémenter**

```ts
// genererMessageErreur.ts
import {
  TableSchema,
  ViolationContrainte,
} from "@/server/import-indicateur/infrastructure/adapters/validation-fichier/TableSchema.types";

export function genererMessageErreur(
  violation: ViolationContrainte,
  schema: TableSchema,
): string {
  const ligne = violation.ligneDeDonnees + 2;

  if (violation.type === "primaryKey-duplicate" || violation.type === "primaryKey-vide") {
    return `La ligne ${ligne} est vide ou comporte les mêmes zone, date, identifiant d'indicateur et type de valeur qu'une autre ligne. Veuillez la modifier ou la supprimer.`;
  }

  if (violation.nomDuChamp === "identifiant_indic") {
    if (violation.type === "required") {
      return `Un indicateur ne peut etre vide. C'est le cas à la ligne ${ligne}.`;
    }
    if (violation.type === "pattern") {
      return "L'identifiant de l'indicateur doit être renseigné dans le format IND-XXX. Vous pouvez vous référer au guide des indicateurs pour trouver l'identifiant de votre indicateur.";
    }
  }

  if (violation.nomDuChamp === "zone_id" && violation.type === "pattern") {
    return `La zone renseignée '${violation.cellule}' n'est pas une zone valide pour ce schéma d'import (ligne ${ligne}).`;
  }

  if (violation.nomDuChamp === "date_valeur" && violation.type === "pattern") {
    return `La date '${violation.cellule}' n'est pas dans un format valide (AAAA-MM-JJ ou JJ/MM/AAAA), ligne ${ligne}.`;
  }

  if (violation.nomDuChamp === "type_valeur" && violation.type === "enum") {
    return "Le type de valeur doit être vi (valeur initiale), va (valeur d'avancement) ou vc (valeur cible).";
  }

  if (violation.nomDuChamp === "valeur" && violation.type === "type") {
    return `La valeur '${violation.cellule}' n'est pas un nombre valide (ligne ${ligne}).`;
  }

  if (
    violation.nomDuChamp === "valeur" &&
    (violation.type === "minimum" || violation.type === "maximum")
  ) {
    const champSchema = schema.fields.find((champ) => champ.name === "valeur");
    const borne =
      violation.type === "minimum"
        ? champSchema?.constraints?.minimum
        : champSchema?.constraints?.maximum;
    const comparateur =
      violation.type === "minimum" ? "supérieure ou égale à" : "inférieure ou égale à";
    return `La valeur '${violation.cellule}' doit être ${comparateur} ${borne} (ligne ${ligne}).`;
  }

  if (violation.type === "required") {
    return `Le champ '${violation.nomDuChamp}' est obligatoire. C'est le cas à la ligne ${ligne}.`;
  }

  if (violation.type === "enum") {
    const champSchema = schema.fields.find((champ) => champ.name === violation.nomDuChamp);
    const valeursAutorisees = champSchema?.constraints?.enum?.join(", ") ?? "";
    return `La valeur '${violation.cellule}' de la colonne '${violation.nomDuChamp}' doit être l'une des valeurs autorisées : ${valeursAutorisees} (ligne ${ligne}).`;
  }

  return `La valeur '${violation.cellule}' de la colonne '${violation.nomDuChamp}' n'est pas dans un format valide (ligne ${ligne}).`;
}
```

- [ ] **Step 4: Demander à l'utilisateur de relancer le test et vérifier qu'il passe**

Commande : `pnpm test:server:unit -- src/server/import-indicateur/__tests__/infrastructure/adapters/validation-fichier/genererMessageErreur.unit.test.ts`
Attendu : PASS (10 tests).

- [ ] **Step 5: Commit**

```bash
cd /Users/tristanconti/Documents/pilote-2
git add apps/pilote-ppg/src/server/import-indicateur/infrastructure/adapters/validation-fichier/genererMessageErreur.ts \
        apps/pilote-ppg/src/server/import-indicateur/__tests__/infrastructure/adapters/validation-fichier/genererMessageErreur.unit.test.ts
git commit -m "feat(ppg-import): ajoute le catalogue de messages FR pour les violations de contraintes"
```

---

### Task 7: `LocalFichierIndicateurValidationService` (orchestration)

**Files:**
- Create: `src/server/import-indicateur/infrastructure/adapters/validation-fichier/LocalFichierIndicateurValidationService.ts`
- Create: `src/server/import-indicateur/__tests__/infrastructure/adapters/validation-fichier/LocalFichierIndicateurValidationService.unit.test.ts`

**Interfaces:**
- Consumes: `chargerSchema` (Task 1), `parserFichier` (Tasks 2-3), `validerContraintesDeChamp`/`detecterViolationsClePrimaire` (Tasks 4-5), `genererMessageErreur` (Task 6), `supprimerLeFichier` (`FichierService.ts`, existant), `DetailValidationFichier`/`ErreurValidationFichier`/`MesureIndicateurTemporaire` (domain, existant).
- Produces: classe `LocalFichierIndicateurValidationService implements FichierIndicateurValidationService` (méthode `validerFichier`, même signature que l'ancien adapter).

Ce test utilise le vrai fichier `public/schema/sans-contraintes.json` déjà présent dans le repo (pas besoin de mock du schéma) et de vrais fichiers CSV temporaires (comme Task 2). C'est un test "sociable" : seule la lecture/écriture disque est réelle, aucune dépendance DB/réseau.

- [ ] **Step 1: Écrire les tests**

```ts
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { LocalFichierIndicateurValidationService } from "@/server/import-indicateur/infrastructure/adapters/validation-fichier/LocalFichierIndicateurValidationService";

function ecrireFichierCsvTemporaire(contenu: string): string {
  const cheminFichier = path.join(os.tmpdir(), `import-test-${Date.now()}-${Math.random()}.csv`);
  fs.writeFileSync(cheminFichier, contenu);
  return cheminFichier;
}

describe("LocalFichierIndicateurValidationService", () => {
  let service: LocalFichierIndicateurValidationService;

  beforeEach(() => {
    service = new LocalFichierIndicateurValidationService();
  });

  it("doit valider un fichier correct et construire les mesures", async () => {
    const cheminFichier = ecrireFichierCsvTemporaire(
      "identifiant_indic,zone_id,date_valeur,type_valeur,valeur\nIND-001,D001,2023-01-31,vi,9\n",
    );

    const rapport = await service.validerFichier({
      cheminCompletDuFichier: cheminFichier,
      nomDuFichier: "fichier.csv",
      schema: "sans-contraintes.json",
      utilisateurEmail: "ditp.admin@example.com",
    });

    expect(rapport.estValide).toEqual(true);
    expect(rapport.listeErreursValidation).toEqual([]);
    expect(rapport.listeMesuresIndicateurTemporaire).toHaveLength(1);
    expect(rapport.listeMesuresIndicateurTemporaire[0].indicId).toEqual("IND-001");
    expect(rapport.listeMesuresIndicateurTemporaire[0].zoneId).toEqual("D001");
    expect(rapport.listeMesuresIndicateurTemporaire[0].metricDate).toEqual("2023-01-31");
    expect(rapport.listeMesuresIndicateurTemporaire[0].metricType).toEqual("vi");
    expect(rapport.listeMesuresIndicateurTemporaire[0].metricValue).toEqual("9");
  });

  it("doit remonter une erreur de pattern sur identifiant_indic", async () => {
    const cheminFichier = ecrireFichierCsvTemporaire(
      "identifiant_indic,zone_id,date_valeur,type_valeur,valeur\nINVALIDE,D001,2023-01-31,vi,9\n",
    );

    const rapport = await service.validerFichier({
      cheminCompletDuFichier: cheminFichier,
      nomDuFichier: "fichier.csv",
      schema: "sans-contraintes.json",
      utilisateurEmail: "ditp.admin@example.com",
    });

    expect(rapport.estValide).toEqual(false);
    expect(rapport.listeErreursValidation).toHaveLength(1);
    expect(rapport.listeErreursValidation[0].nomDuChamp).toEqual("identifiant_indic");
    expect(rapport.listeErreursValidation[0].cellule).toEqual("INVALIDE");
    expect(rapport.listeErreursValidation[0].numeroDeLigne).toEqual(2);
    expect(rapport.listeErreursValidation[0].positionDeLigne).toEqual(0);
    expect(rapport.listeErreursValidation[0].message).toEqual(
      "L'identifiant de l'indicateur doit être renseigné dans le format IND-XXX. Vous pouvez vous référer au guide des indicateurs pour trouver l'identifiant de votre indicateur.",
    );
  });

  it("doit remonter une erreur de clé primaire dupliquée", async () => {
    const cheminFichier = ecrireFichierCsvTemporaire(
      "identifiant_indic,zone_id,date_valeur,type_valeur,valeur\n" +
        "IND-001,D001,2023-01-31,vi,9\n" +
        "IND-001,D001,2023-01-31,vi,3\n",
    );

    const rapport = await service.validerFichier({
      cheminCompletDuFichier: cheminFichier,
      nomDuFichier: "fichier.csv",
      schema: "sans-contraintes.json",
      utilisateurEmail: "ditp.admin@example.com",
    });

    expect(rapport.estValide).toEqual(false);
    expect(rapport.listeErreursValidation).toHaveLength(1);
    expect(rapport.listeErreursValidation[0].message).toEqual(
      "La ligne 3 est vide ou comporte les mêmes zone, date, identifiant d'indicateur et type de valeur qu'une autre ligne. Veuillez la modifier ou la supprimer.",
    );
  });

  it("quand l'en-tête identifiant_indic est absente, doit remonter une erreur dédiée et ne construire aucune mesure", async () => {
    const cheminFichier = ecrireFichierCsvTemporaire(
      "id_indic,zone_id,date_valeur,type_valeur,valeur\nIND-001,D001,2023-01-31,vi,9\n",
    );

    const rapport = await service.validerFichier({
      cheminCompletDuFichier: cheminFichier,
      nomDuFichier: "fichier.csv",
      schema: "sans-contraintes.json",
      utilisateurEmail: "ditp.admin@example.com",
    });

    expect(rapport.estValide).toEqual(false);
    expect(rapport.listeMesuresIndicateurTemporaire).toEqual([]);
    expect(rapport.listeErreursValidation).toEqual([
      expect.objectContaining({
        nom: "En-tête incorrect",
        message: "L'en-tête identifiant_indic n'est pas présente",
      }),
    ]);
  });

  it("quand un en-tête comporte un espace, doit remonter une erreur dédiée sans bloquer la construction des mesures", async () => {
    const cheminFichier = ecrireFichierCsvTemporaire(
      '"identifiant_indic",zone_id,date_valeur,type_valeur,"valeur "\nIND-001,D001,2023-01-31,vi,9\n',
    );

    const rapport = await service.validerFichier({
      cheminCompletDuFichier: cheminFichier,
      nomDuFichier: "fichier.csv",
      schema: "sans-contraintes.json",
      utilisateurEmail: "ditp.admin@example.com",
    });

    expect(rapport.listeErreursValidation).toContainEqual(
      expect.objectContaining({
        nom: "En-tête incorrect",
        message: "Le champ de l'en-tête 'valeur' comporte des espaces, veuillez les supprimer",
      }),
    );
    expect(rapport.listeMesuresIndicateurTemporaire).toHaveLength(1);
  });

  it("quand la validation échoue avec une exception (schéma inexistant), doit remonter un message générique", async () => {
    const cheminFichier = ecrireFichierCsvTemporaire(
      "identifiant_indic,zone_id,date_valeur,type_valeur,valeur\nIND-001,D001,2023-01-31,vi,9\n",
    );

    const rapport = await service.validerFichier({
      cheminCompletDuFichier: cheminFichier,
      nomDuFichier: "fichier.csv",
      schema: "inexistant.json",
      utilisateurEmail: "ditp.admin@example.com",
    });

    expect(rapport.estValide).toEqual(false);
    expect(rapport.listeErreursValidation[0].message).toEqual(
      "Une erreur est survenue lors de la validation de la forme du fichier",
    );
  });
});
```

- [ ] **Step 2: Demander à l'utilisateur de lancer le test et vérifier qu'il échoue**

Commande : `pnpm test:server:unit -- src/server/import-indicateur/__tests__/infrastructure/adapters/validation-fichier/LocalFichierIndicateurValidationService.unit.test.ts`
Attendu : FAIL — le module n'existe pas encore.

- [ ] **Step 3: Implémenter**

```ts
// LocalFichierIndicateurValidationService.ts
import { DetailValidationFichier } from "@/server/import-indicateur/domain/DetailValidationFichier";
import { MesureIndicateurTemporaire } from "@/server/import-indicateur/domain/MesureIndicateurTemporaire";
import {
  FichierIndicateurValidationService,
  ValiderFichierPayload,
} from "@/server/import-indicateur/domain/ports/FichierIndicateurValidationService.interface";
import { ErreurValidationFichier } from "@/server/import-indicateur/domain/ErreurValidationFichier";
import logger from "@/server/infrastructure/Logger";
import { chargerSchema } from "@/server/import-indicateur/infrastructure/adapters/validation-fichier/SchemaRepository";
import { parserFichier } from "@/server/import-indicateur/infrastructure/adapters/validation-fichier/FichierParser";
import {
  validerContraintesDeChamp,
  detecterViolationsClePrimaire,
} from "@/server/import-indicateur/infrastructure/adapters/validation-fichier/TableSchemaValidator";
import { genererMessageErreur } from "@/server/import-indicateur/infrastructure/adapters/validation-fichier/genererMessageErreur";
import {
  TableSchema,
  ViolationContrainte,
} from "@/server/import-indicateur/infrastructure/adapters/validation-fichier/TableSchema.types";
import { supprimerLeFichier } from "@/server/import-indicateur/infrastructure/adapters/FichierService";

const creerErreurEnTete = (rapportId: string, message: string): ErreurValidationFichier =>
  ErreurValidationFichier.creerErreurValidationFichier({
    rapportId,
    cellule: "Cellule non définie",
    nom: "En-tête incorrect",
    message,
    numeroDeLigne: 0,
    positionDeLigne: 0,
    nomDuChamp: "",
    positionDuChamp: 0,
  });

const construireErreurDepuisViolation = (
  rapportId: string,
  violation: ViolationContrainte,
  entetes: string[],
  schema: TableSchema,
): ErreurValidationFichier =>
  ErreurValidationFichier.creerErreurValidationFichier({
    rapportId,
    cellule: violation.cellule,
    nom: violation.type,
    message: genererMessageErreur(violation, schema),
    numeroDeLigne: violation.ligneDeDonnees + 2,
    positionDeLigne: violation.ligneDeDonnees,
    nomDuChamp: violation.nomDuChamp,
    positionDuChamp: entetes.indexOf(violation.nomDuChamp),
  });

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

    try {
      const schema = chargerSchema(nomDuSchema);
      const lignes = await parserFichier(cheminCompletDuFichier, nomDuFichier);
      const [enTeteBrute, ...lignesDeDonnees] = lignes;
      const entetes = enTeteBrute.map((entete) => entete.trim());
      const entetesNormalisees = entetes.map((entete) => entete.toLowerCase());

      const listeErreursValidation: ErreurValidationFichier[] = [];

      enTeteBrute.forEach((entete) => {
        if (entete.trim() !== entete) {
          listeErreursValidation.push(
            creerErreurEnTete(
              rapport.id,
              `Le champ de l'en-tête '${entete.trim()}' comporte des espaces, veuillez les supprimer`,
            ),
          );
        }
        if (entete.toLowerCase() !== entete) {
          listeErreursValidation.push(
            creerErreurEnTete(
              rapport.id,
              `Le champ de l'en-tête '${entete.toLowerCase()}' comporte des majuscules, veuillez les mettre en minuscule`,
            ),
          );
        }
      });

      const contientDoublons = new Set(entetesNormalisees).size !== entetesNormalisees.length;
      const contientTousLesChamps = schema.fields.every((champ) =>
        entetesNormalisees.includes(champ.name),
      );

      let listeIndicateursData: MesureIndicateurTemporaire[] = [];

      if (!entetesNormalisees.includes("identifiant_indic")) {
        listeErreursValidation.push(
          creerErreurEnTete(rapport.id, "L'en-tête identifiant_indic n'est pas présente"),
        );
      } else if (contientDoublons) {
        listeErreursValidation.push(
          creerErreurEnTete(rapport.id, "Il existe des entêtes en doublon dans le fichier"),
        );
      } else if (!contientTousLesChamps) {
        listeErreursValidation.push(
          creerErreurEnTete(
            rapport.id,
            `Les en-têtes du fichier sont invalides, les en-têtes doivent être [${schema.fields
              .map((champ) => champ.name)
              .join(", ")}]`,
          ),
        );
      } else {
        const violations = [
          ...validerContraintesDeChamp(schema, entetesNormalisees, lignesDeDonnees),
          ...detecterViolationsClePrimaire(schema, entetesNormalisees, lignesDeDonnees),
        ];

        violations.forEach((violation) => {
          listeErreursValidation.push(
            construireErreurDepuisViolation(rapport.id, violation, entetesNormalisees, schema),
          );
        });

        listeIndicateursData = lignesDeDonnees.map((ligne) =>
          MesureIndicateurTemporaire.createMesureIndicateurTemporaire({
            rapportId: rapport.id,
            indicId: ligne[entetesNormalisees.indexOf("identifiant_indic")] ?? null,
            zoneId: ligne[entetesNormalisees.indexOf("zone_id")] ?? null,
            metricDate: ligne[entetesNormalisees.indexOf("date_valeur")] ?? null,
            metricType: ligne[entetesNormalisees.indexOf("type_valeur")] ?? null,
            metricValue: `${ligne[entetesNormalisees.indexOf("valeur")] ?? ""}`,
          }),
        );
      }

      rapport.affecterListeMesuresIndicateurTemporaire(listeIndicateursData);
      rapport.affecterListeErreursValidation(listeErreursValidation);

      return DetailValidationFichier.creerDetailValidationFichier({
        id: rapport.id,
        dateCreation: rapport.dateCreation,
        estValide: listeErreursValidation.length === 0,
        utilisateurEmail,
        listeErreursValidation: rapport.listeErreursValidation,
        listeMesuresIndicateurTemporaire: rapport.listeMesuresIndicateurTemporaire,
      });
    } catch (error) {
      logger.error(
        {
          categorie: "import",
          source: "LocalFichierIndicateurValidationService",
          nomDuFichier,
          utilisateurEmail,
        },
        (error as Error).message,
      );

      rapport.affecterListeErreursValidation([
        ErreurValidationFichier.creerErreurValidationFichier({
          rapportId: rapport.id,
          cellule: "Cellule non définie",
          nom: "Erreur non identifié",
          message: "Une erreur est survenue lors de la validation de la forme du fichier",
          numeroDeLigne: 0,
          positionDeLigne: 0,
          nomDuChamp: "",
          positionDuChamp: 0,
        }),
      ]);

      return rapport;
    } finally {
      supprimerLeFichier(cheminCompletDuFichier);
    }
  }
}
```

- [ ] **Step 4: Demander à l'utilisateur de relancer le test et vérifier qu'il passe**

Commande : `pnpm test:server:unit -- src/server/import-indicateur/__tests__/infrastructure/adapters/validation-fichier/LocalFichierIndicateurValidationService.unit.test.ts`
Attendu : PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
cd /Users/tristanconti/Documents/pilote-2
git add apps/pilote-ppg/src/server/import-indicateur/infrastructure/adapters/validation-fichier/LocalFichierIndicateurValidationService.ts \
        apps/pilote-ppg/src/server/import-indicateur/__tests__/infrastructure/adapters/validation-fichier/LocalFichierIndicateurValidationService.unit.test.ts
git commit -m "feat(ppg-import): ajoute LocalFichierIndicateurValidationService, orchestrateur de la validation locale"
```

---

### Task 8: Retirer `baseSchemaUrl` des appelants

**Files:**
- Modify: `src/server/import-indicateur/usecases/VerifierFichierIndicateurImporteUseCase.ts`
- Modify: `src/server/import-indicateur/infrastructure/handlers/ImportDonneeIndicateurAPIHandler.ts`
- Modify: `src/server/import-indicateur/infrastructure/handlers/VerifierImportIndicateurHandler.ts`
- Modify: `src/server/gestion-contenu/usecases/RecupererVariableContenuUseCase.ts`
- Modify: `src/server/gestion-contenu/domain/VariableContenuDisponible.ts`
- Modify: `src/server/import-indicateur/__tests__/usecases/VerifierFichierIndicateurImporteUseCase.integration.test.ts`

**Interfaces:**
- `VerifierFichierIndicateurImporteUseCase.execute()` perd le paramètre `baseSchemaUrl` ; `schema` transmis au port est désormais directement le nom de fichier (`"sans-contraintes.json"` ou `informationIndicateur.indicSchema`).

- [ ] **Step 1: Modifier `VerifierFichierIndicateurImporteUseCase.ts`**

Dans la signature de `execute`, supprimer `baseSchemaUrl` du type et de la déstructuration (ligne 141-155 actuelles) :

```ts
  async execute({
    cheminCompletDuFichier,
    nomDuFichier,
    indicateurId,
    utilisateurAuteurDeLimportEmail,
    isAdmin = false,
  }: {
    cheminCompletDuFichier: string;
    nomDuFichier: string;
    indicateurId: string;
    utilisateurAuteurDeLimportEmail: string;
    isAdmin?: boolean;
  }): Promise<DetailValidationFichier> {
```

Puis remplacer l'appel à `validerFichier` (ligne ~166-173 actuelles) :

```ts
    const report = await this.fichierIndicateurValidationService.validerFichier({
      cheminCompletDuFichier,
      nomDuFichier,
      schema,
      utilisateurEmail: utilisateurAuteurDeLimportEmail,
    });
```

- [ ] **Step 2: Modifier `ImportDonneeIndicateurAPIHandler.ts`**

Retirer l'import `configuration` (devenu inutilisé) :

```ts
import { configuration } from "@/config";
```

Et retirer la ligne `baseSchemaUrl: configuration().schemaValidataUrl,` de l'appel à `execute()` (ligne 167 actuelle).

- [ ] **Step 3: Modifier `VerifierImportIndicateurHandler.ts`**

Retirer l'import `RecupererVariableContenuUseCase`, et dans `handle()`, retirer :

```ts
    const récupérerVariableContenuUseCase =
      new RecupererVariableContenuUseCase();
    const baseSchemaUrl = récupérerVariableContenuUseCase.run({
      nomVariableContenu: "NEXT_PUBLIC_SCHEMA_VALIDATA_URL",
    });
```

et retirer les 2 lignes suivantes de l'appel à `execute()` :

```ts
      // @ts-expect-error baseSchemaUrl ne peut être undefined
      baseSchemaUrl,
```

- [ ] **Step 4: Retirer `NEXT_PUBLIC_SCHEMA_VALIDATA_URL` de `RecupererVariableContenuUseCase.ts`**

Supprimer le bloc `case "NEXT_PUBLIC_SCHEMA_VALIDATA_URL": { ... }` (lignes 21-24 actuelles).

- [ ] **Step 5: Retirer `NEXT_PUBLIC_SCHEMA_VALIDATA_URL` de `VariableContenuDisponible.ts`**

Retirer `"NEXT_PUBLIC_SCHEMA_VALIDATA_URL"` du tableau `VARIABLE_CONTENU_NON_FF` et retirer la ligne `NEXT_PUBLIC_SCHEMA_VALIDATA_URL: string;` du type `VariableContenuDisponibleEnv`.

- [ ] **Step 6: Mettre à jour le test d'intégration du use case**

```bash
cd /Users/tristanconti/Documents/pilote-2/apps/pilote-ppg
sed -i '' '/^\s*baseSchemaUrl: SCHEMA,$/d' src/server/import-indicateur/__tests__/usecases/VerifierFichierIndicateurImporteUseCase.integration.test.ts
sed -i '' '/^\s*const SCHEMA = "base\/schema\/url\/";$/d' src/server/import-indicateur/__tests__/usecases/VerifierFichierIndicateurImporteUseCase.integration.test.ts
```

Puis, avec l'outil Edit, corriger le titre et l'assertion du test qui vérifiait la concaténation :

```ts
// Avant
it("quand l'indicateur possède des informations, doit concaténer le schema en metadata associé à l'indicateur", async () => {
// ...
    expect(payloadValiderFichier.schema).toEqual("base/schema/url/schema.json");

// Après
it("quand l'indicateur possède des informations, doit transmettre le nom du schéma associé à l'indicateur", async () => {
// ...
    expect(payloadValiderFichier.schema).toEqual("schema.json");
```

- [ ] **Step 7: Demander à l'utilisateur de lancer les tests concernés et vérifier qu'ils passent**

Commande : `pnpm test:server:integration -- src/server/import-indicateur/__tests__/usecases/VerifierFichierIndicateurImporteUseCase.integration.test.ts`
Attendu : PASS (tous les tests du fichier).

Commande : `pnpm test:server:unit -- src/server/gestion-contenu`
Attendu : PASS (aucune régression sur `RecupererVariableContenuUseCase`/`VariableContenuDisponible` s'il existe des tests dédiés — sinon, aucun test à lancer, vérifier juste la compilation TypeScript avec l'étape suivante).

- [ ] **Step 8: Demander à l'utilisateur de vérifier la compilation TypeScript**

Commande : `pnpm exec tsc --noEmit`
Attendu : aucune erreur liée à `baseSchemaUrl`, `configuration` inutilisé, ou `NEXT_PUBLIC_SCHEMA_VALIDATA_URL`.

- [ ] **Step 9: Commit**

```bash
cd /Users/tristanconti/Documents/pilote-2
git add apps/pilote-ppg/src/server/import-indicateur/usecases/VerifierFichierIndicateurImporteUseCase.ts \
        apps/pilote-ppg/src/server/import-indicateur/infrastructure/handlers/ImportDonneeIndicateurAPIHandler.ts \
        apps/pilote-ppg/src/server/import-indicateur/infrastructure/handlers/VerifierImportIndicateurHandler.ts \
        apps/pilote-ppg/src/server/gestion-contenu/usecases/RecupererVariableContenuUseCase.ts \
        apps/pilote-ppg/src/server/gestion-contenu/domain/VariableContenuDisponible.ts \
        apps/pilote-ppg/src/server/import-indicateur/__tests__/usecases/VerifierFichierIndicateurImporteUseCase.integration.test.ts
git commit -m "refactor(ppg-import): retire baseSchemaUrl, le nom du schéma suffit désormais à la validation locale"
```

---

### Task 9: Brancher `LocalFichierIndicateurValidationService` et supprimer le code Validata obsolète

**Files:**
- Modify: `src/server/import-indicateur/module.ts`
- Modify: `src/config.ts`
- Delete: `src/server/import-indicateur/infrastructure/adapters/FetchHttpClient.ts`
- Delete: `src/server/import-indicateur/domain/ports/HttpClient.interface.ts`
- Delete: `src/server/import-indicateur/infrastructure/adapters/ValidataFichierIndicateurValidationService.ts`
- Delete: `src/server/import-indicateur/infrastructure/ReportValidata.interface.ts`
- Delete: `src/server/import-indicateur/app/builder/ReportValidataWithDataBuilder.ts`
- Delete: `src/server/import-indicateur/app/builder/ReportErrorBuilder.ts`
- Delete: `src/server/import-indicateur/__tests__/infrastructure/adapters/ValidataFichierIndicateurValidationService.integration.test.ts`

**Interfaces:**
- Consumes: `LocalFichierIndicateurValidationService` (Task 7).
- Produces: le cradle `importIndicateur` n'expose plus `httpClient`.

- [ ] **Step 1: Modifier `module.ts`**

Retirer les imports de `FetchHttpClient` et `HttpClient` (interface), ajouter l'import de `LocalFichierIndicateurValidationService` :

```ts
import { LocalFichierIndicateurValidationService } from "@/server/import-indicateur/infrastructure/adapters/validation-fichier/LocalFichierIndicateurValidationService";
```

Retirer `httpClient: HttpClient;` de `ImportIndicateurOwnCradle`.

Dans `register`, retirer `httpClient: asModuleClass(FetchHttpClient),` et remplacer :

```ts
      fichierIndicateurValidationService: asModuleClass(
        ValidataFichierIndicateurValidationService,
      ),
```

par :

```ts
      fichierIndicateurValidationService: asModuleClass(
        LocalFichierIndicateurValidationService,
      ),
```

- [ ] **Step 2: Nettoyer `config.ts`**

Retirer le sous-champ `urlValidata` du bloc `import: { ... }` (garder `keycloakUrl`/`clientId`/`clientSecret`, propres à l'import Keycloak d'utilisateurs, sans rapport) :

```ts
// Avant
  import: {
    keycloakUrl: { ... },
    clientId: { ... },
    clientSecret: { ... },
    urlValidata: {
      format: String,
      default: "https://api.validata.etalab.studio/validate",
      env: "URL_VALIDATA",
    },
  },

// Après
  import: {
    keycloakUrl: { ... },
    clientId: { ... },
    clientSecret: { ... },
  },
```

Retirer entièrement le bloc `schemaValidataUrl: { ... }` (config racine).

- [ ] **Step 3: Supprimer les fichiers obsolètes**

```bash
cd /Users/tristanconti/Documents/pilote-2/apps/pilote-ppg
rm src/server/import-indicateur/infrastructure/adapters/FetchHttpClient.ts
rm src/server/import-indicateur/domain/ports/HttpClient.interface.ts
rm src/server/import-indicateur/infrastructure/adapters/ValidataFichierIndicateurValidationService.ts
rm src/server/import-indicateur/infrastructure/ReportValidata.interface.ts
rm src/server/import-indicateur/app/builder/ReportValidataWithDataBuilder.ts
rm src/server/import-indicateur/app/builder/ReportErrorBuilder.ts
rm src/server/import-indicateur/__tests__/infrastructure/adapters/ValidataFichierIndicateurValidationService.integration.test.ts
```

- [ ] **Step 4: Demander à l'utilisateur de vérifier la compilation TypeScript**

Commande : `pnpm exec tsc --noEmit`
Attendu : aucune erreur (en particulier aucune référence résiduelle à `HttpClient`, `FetchHttpClient`, `ValidataFichierIndicateurValidationService`, `ReportValidata*`).

- [ ] **Step 5: Commit**

```bash
cd /Users/tristanconti/Documents/pilote-2
git add apps/pilote-ppg/src/server/import-indicateur/module.ts apps/pilote-ppg/src/config.ts
git add -u apps/pilote-ppg/src/server/import-indicateur/infrastructure/adapters/FetchHttpClient.ts \
           apps/pilote-ppg/src/server/import-indicateur/domain/ports/HttpClient.interface.ts \
           apps/pilote-ppg/src/server/import-indicateur/infrastructure/adapters/ValidataFichierIndicateurValidationService.ts \
           apps/pilote-ppg/src/server/import-indicateur/infrastructure/ReportValidata.interface.ts \
           apps/pilote-ppg/src/server/import-indicateur/app/builder/ReportValidataWithDataBuilder.ts \
           apps/pilote-ppg/src/server/import-indicateur/app/builder/ReportErrorBuilder.ts \
           apps/pilote-ppg/src/server/import-indicateur/__tests__/infrastructure/adapters/ValidataFichierIndicateurValidationService.integration.test.ts
git commit -m "refactor(ppg-import): bascule le DI vers LocalFichierIndicateurValidationService et supprime le code Validata"
```

---

### Task 10: Réécrire les tests d'intégration des handlers

**Files:**
- Modify: `src/server/import-indicateur/__tests__/infrastructure/handlers/VerifierImportIndicateurHandler.integration.test.ts`
- Modify: `src/server/import-indicateur/__tests__/infrastructure/handlers/ImportDonneeIndicateurAPIHandler.integration.test.ts`

**Interfaces:**
- Consumes: `DetailValidationFichierBuilder`, `ErreurValidationFichierBuilder`, `MesureIndicateurTemporaireBuilder` (builders existants, inchangés).

**Principe de la réécriture :** ces tests ne testent pas le moteur de validation réel (couvert en profondeur par les tests unitaires des Tasks 4-7) — ils testent que le handler persiste et restitue correctement un résultat de validation donné. Le point de mock passe donc de "l'appel HTTP à Validata" (`nock`) à "l'adapter `LocalFichierIndicateurValidationService`" (`vi.mock`), en suivant exactement le même principe déjà utilisé dans ces fichiers pour mocker `FichierService`. Comme les colonnes `id`/`rapport_id` de `mesure_indicateur_temporaire`, `erreur_validation_fichier` et `rapport_import_mesure_indicateur` sont des `Uuid` Postgres (`schema.prisma:627,633,641,649,656`), chaque id/rapportId de builder utilisé dans un test qui écrit réellement en base doit être un UUID valide (`randomUUID()`), généré une fois par test et partagé entre le rapport et ses erreurs/mesures.

**Table de correspondance (ancien → nouveau) :**

| Ancien (Validata) | Nouveau |
|---|---|
| `nock(BASE_URL_VALIDATA).post("/validate").reply(200, JSON.stringify({ report, resource_data: report.resource_data }))` | `validerFichierMock.mockResolvedValue(detailValidationFichier)` |
| `new ReportValidataWithDataBuilder().avecValid(true).avecResourceData([entetes], [ligne1], [ligne2]).build()` | `new DetailValidationFichierBuilder().avecId(rapportId).avecEstValide(true).avecUtilisateurEmail(email).avecListeMesuresIndicateurTemporaire(...mesures).build()`, une `MesureIndicateurTemporaireBuilder` par ligne (`.avecId(randomUUID()).avecRapportId(rapportId).avecIndicId(...).avecZoneId(...).avecMetricDate(...).avecMetricType(...).avecMetricValue(...)`) |
| `new ReportValidataWithDataBuilder().avecValid(false).avecErrors(...).build()` | `new DetailValidationFichierBuilder().avecId(rapportId).avecEstValide(false).avecUtilisateurEmail(email).avecListeErreursValidation(...erreurs).build()`, une `ErreurValidationFichierBuilder` par erreur (`.avecId(randomUUID()).avecRapportId(rapportId).avecCellule(...).avecNom(...).avecNomDuChamp(...).avecPositionDuChamp(...).avecMessage(...).avecNumeroDeLigne(...).avecPositionDeLigne(...)`) |
| `const BASE_URL_VALIDATA = "..."` | supprimé |
| `import { ReportValidataWithDataBuilder } from ".../ReportValidataWithDataBuilder"` / `ReportErrorBuilder` | remplacés par `DetailValidationFichierBuilder`, `ErreurValidationFichierBuilder`, `MesureIndicateurTemporaireBuilder` |
| `import nock from "nock"` | supprimé |

- [ ] **Step 1: Réécrire `VerifierImportIndicateurHandler.integration.test.ts`**

Remplacer l'intégralité du fichier par :

```ts
import { createMocks } from "node-mocks-http";
import { anyString, mock } from "vitest-mock-extended";
import PersistentFile from "formidable/PersistentFile";
import { NextApiRequest, NextApiResponse } from "next";
import { randomUUID } from "node:crypto";
import { DetailValidationFichierBuilder } from "@/server/import-indicateur/app/builder/DetailValidationFichier.builder";
import { ErreurValidationFichierBuilder } from "@/server/import-indicateur/app/builder/ErreurValidationFichier.builder";
import { MesureIndicateurTemporaireBuilder } from "@/server/import-indicateur/app/builder/MesureIndicateurTemporaire.builder";
import UtilisateurÀCréerOuMettreÀJourBuilder from "@/server/domain/utilisateur/UtilisateurÀCréerOuMettreÀJour.builder";
import { getNextAuthSessionTokenPourUtilisateurEmail } from "@/server/infrastructure/test/NextAuthHelper";
import { ProfilEnum } from "@/server/app/enum/profil.enum";
import { getContainer } from "@/server/dependances";
import { prisma } from "@/server/db/prisma";

const validerFichierMock = vi.fn();

vi.mock(
  "@/server/import-indicateur/infrastructure/adapters/validation-fichier/LocalFichierIndicateurValidationService",
  () => ({
    LocalFichierIndicateurValidationService: vi
      .fn()
      .mockImplementation(() => ({ validerFichier: validerFichierMock })),
  }),
);
vi.mock("@/server/import-indicateur/infrastructure/handlers/ParseForm", () => ({
  parseForm: () => ({
    file: mock<PersistentFile>(),
  }),
}));
vi.mock(
  "@/server/import-indicateur/infrastructure/adapters/FichierService.ts",
  () => ({
    recupererFichier: () => "fichierRécupéré",
    supprimerLeFichier: () => "fichierSupprimé",
  }),
);

const DONNEE_DATE_1 = "2023-12-30";
const DONNEE_DATE_2 = "31/12/2023";

// next-auth v5 lit les cookies depuis le header "cookie", pas depuis req.cookies
async function createMocksAvecSessionToken(
  sessionToken: string,
  indicateurId: string,
) {
  return createMocks<NextApiRequest, NextApiResponse>({
    method: "POST",
    body: new FormData(),
    cookies: {
      "authjs.session-token": sessionToken,
    },
    headers: {
      cookie: `authjs.session-token=${sessionToken}`,
    },
    query: { indicateurId },
  });
}

async function creeUnUtilisateurEnBase() {
  const auteurId = randomUUID();
  await prisma.utilisateur.create({
    data: {
      id: auteurId,
      email: "john.doe@test.com",
      nom: "John",
      prenom: "Doe",
      date_creation: new Date().toISOString(),
      profil: {
        connect: {
          code: ProfilEnum.DITP_ADMIN,
        },
      },
    },
  });
  return auteurId;
}

beforeEach(() => {
  validerFichierMock.mockReset();
});

describe("VerifierImportIndicateurHandler", () => {
  describe("Quand le fichier envoyé est correct", () => {
    it("doit retourner que le fichier est valide", async () => {
      // Given
      const auteurId = await creeUnUtilisateurEnBase();
      const rapportId = randomUUID();
      validerFichierMock.mockResolvedValue(
        new DetailValidationFichierBuilder()
          .avecId(rapportId)
          .avecEstValide(true)
          .avecUtilisateurEmail("ditp.admin@example.com")
          .avecListeMesuresIndicateurTemporaire(
            new MesureIndicateurTemporaireBuilder()
              .avecId(randomUUID())
              .avecRapportId(rapportId)
              .avecIndicId("IND-001")
              .avecZoneId("D001")
              .avecMetricDate(DONNEE_DATE_1)
              .avecMetricType("vi")
              .avecMetricValue("9")
              .build(),
            new MesureIndicateurTemporaireBuilder()
              .avecId(randomUUID())
              .avecRapportId(rapportId)
              .avecIndicId("IND-001")
              .avecZoneId("D004")
              .avecMetricDate(DONNEE_DATE_2)
              .avecMetricType("vc")
              .avecMetricValue("3")
              .build(),
          )
          .build(),
      );

      const utilisateur = new UtilisateurÀCréerOuMettreÀJourBuilder()
        .avecEmail("ditp.admin@example.com")
        .avecProfil(ProfilEnum.DITP_ADMIN)
        .avecHabilitationsLecture([], [], [])
        .build();
      await getContainer("authentification")
        .resolve("utilisateurRepository")
        .créerOuMettreÀJour(utilisateur, auteurId);

      // When
      const sessionToken = await getNextAuthSessionTokenPourUtilisateurEmail(
        "ditp.admin@example.com",
      );
      const { req, res } = await createMocksAvecSessionToken(
        sessionToken,
        "IND-001",
      );

      await getContainer("importIndicateur")
        .resolve("verifierFichierImportIndicateurHandler")
        .handle(req, res);

      // Then
      expect(res._getStatusCode()).toEqual(200);
      expect(res._getJSONData()).toStrictEqual({
        id: anyString(),
        estValide: true,
        listeErreursValidation: [],
      });
    });

    it("doit sauvegarder les données du fichier", async () => {
      // Given
      const auteurId = await creeUnUtilisateurEnBase();
      const rapportId = randomUUID();
      validerFichierMock.mockResolvedValue(
        new DetailValidationFichierBuilder()
          .avecId(rapportId)
          .avecEstValide(true)
          .avecUtilisateurEmail("ditp.admin@example.com")
          .avecListeMesuresIndicateurTemporaire(
            new MesureIndicateurTemporaireBuilder()
              .avecId(randomUUID())
              .avecRapportId(rapportId)
              .avecIndicId("IND-001")
              .avecZoneId("D001")
              .avecMetricDate(DONNEE_DATE_1)
              .avecMetricType("vi")
              .avecMetricValue("9")
              .build(),
            new MesureIndicateurTemporaireBuilder()
              .avecId(randomUUID())
              .avecRapportId(rapportId)
              .avecIndicId("IND-001")
              .avecZoneId("D004")
              .avecMetricDate(DONNEE_DATE_2)
              .avecMetricType("vc")
              .avecMetricValue("3")
              .build(),
          )
          .build(),
      );

      const utilisateur = new UtilisateurÀCréerOuMettreÀJourBuilder()
        .avecEmail("ditp.admin@example.com")
        .avecProfil(ProfilEnum.DITP_ADMIN)
        .avecHabilitationsLecture([], [], [])
        .build();
      await getContainer("authentification")
        .resolve("utilisateurRepository")
        .créerOuMettreÀJour(utilisateur, auteurId);

      const sessionToken = await getNextAuthSessionTokenPourUtilisateurEmail(
        "ditp.admin@example.com",
      );
      const { req, res } = await createMocksAvecSessionToken(
        sessionToken,
        "IND-001",
      );

      // When
      await getContainer("importIndicateur")
        .resolve("verifierFichierImportIndicateurHandler")
        .handle(req, res);

      // Then
      const listeDonneesFichier =
        await prisma.mesure_indicateur_temporaire.findMany({
          orderBy: { indic_id: "asc" },
        });
      expect(listeDonneesFichier).toHaveLength(2);
      expect(listeDonneesFichier[0].indic_id).toEqual("IND-001");
      expect(listeDonneesFichier[0].zone_id).toEqual("D001");
      expect(listeDonneesFichier[0].metric_date).toEqual(DONNEE_DATE_1);
      expect(listeDonneesFichier[0].metric_type).toEqual("vi");
      expect(listeDonneesFichier[0].metric_value).toEqual("9");

      expect(listeDonneesFichier[1].indic_id).toEqual("IND-001");
      expect(listeDonneesFichier[1].zone_id).toEqual("D004");
      expect(listeDonneesFichier[1].metric_date).toEqual("2023-12-31");
      expect(listeDonneesFichier[1].metric_type).toEqual("vc");
      expect(listeDonneesFichier[1].metric_value).toEqual("3");
    });

    it("doit sauvegarder le rapport pour lié à l'utilisateur", async () => {
      // Given
      const auteurId = await creeUnUtilisateurEnBase();
      validerFichierMock.mockResolvedValue(
        new DetailValidationFichierBuilder()
          .avecId(randomUUID())
          .avecEstValide(true)
          .avecUtilisateurEmail("ditp.admin@example.com")
          .build(),
      );

      const utilisateur = new UtilisateurÀCréerOuMettreÀJourBuilder()
        .avecEmail("ditp.admin@example.com")
        .avecProfil(ProfilEnum.DITP_ADMIN)
        .avecHabilitationsLecture([], [], [])
        .build();
      await getContainer("authentification")
        .resolve("utilisateurRepository")
        .créerOuMettreÀJour(utilisateur, auteurId);

      const sessionToken = await getNextAuthSessionTokenPourUtilisateurEmail(
        "ditp.admin@example.com",
      );
      const { req, res } = await createMocksAvecSessionToken(
        sessionToken,
        "IND-001",
      );

      // When
      await getContainer("importIndicateur")
        .resolve("verifierFichierImportIndicateurHandler")
        .handle(req, res);

      // Then
      const listeRapport =
        await prisma.rapport_import_mesure_indicateur.findMany();
      expect(listeRapport).toHaveLength(1);

      expect(listeRapport[0].utilisateurEmail).toEqual(
        "ditp.admin@example.com",
      );
    });
  });

  it("Quand le fichier envoyé est incorrect, doit retourner les erreurs du fichier", async () => {
    // Given
    const auteurId = await creeUnUtilisateurEnBase();
    const rapportId = randomUUID();
    validerFichierMock.mockResolvedValue(
      new DetailValidationFichierBuilder()
        .avecId(rapportId)
        .avecEstValide(false)
        .avecUtilisateurEmail("ditp.admin@example.com")
        .avecListeErreursValidation(
          new ErreurValidationFichierBuilder()
            .avecId(randomUUID())
            .avecRapportId(rapportId)
            .avecCellule("cellule 1")
            .avecNom("nom 1")
            .avecNomDuChamp("nom du champ 1")
            .avecPositionDuChamp(1)
            .avecMessage("message 1")
            .avecNumeroDeLigne(1)
            .avecPositionDeLigne(0)
            .build(),
          new ErreurValidationFichierBuilder()
            .avecId(randomUUID())
            .avecRapportId(rapportId)
            .avecCellule("cellule 2")
            .avecNom("nom 2")
            .avecNomDuChamp("nom du champ 2")
            .avecPositionDuChamp(2)
            .avecMessage("message 2")
            .avecNumeroDeLigne(2)
            .avecPositionDeLigne(1)
            .build(),
        )
        .build(),
    );

    const utilisateur = new UtilisateurÀCréerOuMettreÀJourBuilder()
      .avecEmail("ditp.admin@example.com")
      .avecProfil(ProfilEnum.DITP_ADMIN)
      .avecHabilitationsLecture([], [], [])
      .build();
    await getContainer("authentification")
      .resolve("utilisateurRepository")
      .créerOuMettreÀJour(utilisateur, auteurId);

    // When
    const sessionToken = await getNextAuthSessionTokenPourUtilisateurEmail(
      "ditp.admin@example.com",
    );
    const { req, res } = await createMocksAvecSessionToken(
      sessionToken,
      "IND-001",
    );

    await getContainer("importIndicateur")
      .resolve("verifierFichierImportIndicateurHandler")
      .handle(req, res);

    // Then
    expect(res._getStatusCode()).toEqual(200);
    expect(res._getJSONData()).toStrictEqual({
      id: anyString(),
      estValide: false,
      listeErreursValidation: [
        {
          cellule: "cellule 1",
          nom: "nom 1",
          message: "message 1",
          numeroDeLigne: 1,
          positionDeLigne: 0,
          nomDuChamp: "nom du champ 1",
          positionDuChamp: 1,
        },
        {
          cellule: "cellule 2",
          nom: "nom 2",
          message: "message 2",
          numeroDeLigne: 2,
          positionDeLigne: 1,
          nomDuChamp: "nom du champ 2",
          positionDuChamp: 2,
        },
      ],
    });
  });

  it("Quand le fichier envoyé est incorrect, doit sauvegarder les erreurs du fichier", async () => {
    // Given
    const auteurId = await creeUnUtilisateurEnBase();
    const rapportId = randomUUID();
    validerFichierMock.mockResolvedValue(
      new DetailValidationFichierBuilder()
        .avecId(rapportId)
        .avecEstValide(false)
        .avecUtilisateurEmail("ditp.admin@example.com")
        .avecListeErreursValidation(
          new ErreurValidationFichierBuilder()
            .avecId(randomUUID())
            .avecRapportId(rapportId)
            .avecCellule("cellule 1")
            .avecNom("nom 1")
            .avecNomDuChamp("nom du champ 1")
            .avecPositionDuChamp(1)
            .avecMessage("message 1")
            .avecNumeroDeLigne(1)
            .avecPositionDeLigne(0)
            .build(),
          new ErreurValidationFichierBuilder()
            .avecId(randomUUID())
            .avecRapportId(rapportId)
            .avecCellule("cellule 2")
            .avecNom("nom 2")
            .avecNomDuChamp("nom du champ 2")
            .avecPositionDuChamp(2)
            .avecMessage("message 2")
            .avecNumeroDeLigne(2)
            .avecPositionDeLigne(1)
            .build(),
        )
        .build(),
    );

    const utilisateur = new UtilisateurÀCréerOuMettreÀJourBuilder()
      .avecEmail("ditp.admin@example.com")
      .avecProfil(ProfilEnum.DITP_ADMIN)
      .avecHabilitationsLecture([], [], [])
      .build();
    await getContainer("authentification")
      .resolve("utilisateurRepository")
      .créerOuMettreÀJour(utilisateur, auteurId);

    // When
    const sessionToken = await getNextAuthSessionTokenPourUtilisateurEmail(
      "ditp.admin@example.com",
    );
    const { req, res } = await createMocksAvecSessionToken(
      sessionToken,
      "IND-001",
    );

    await getContainer("importIndicateur")
      .resolve("verifierFichierImportIndicateurHandler")
      .handle(req, res);

    // Then
    expect(res._getStatusCode()).toEqual(200);
    const listeErreursValidationFichier =
      await prisma.erreur_validation_fichier.findMany();
    expect(listeErreursValidationFichier[0].cellule).toEqual("cellule 1");
    expect(listeErreursValidationFichier[0].nom).toEqual("nom 1");
    expect(listeErreursValidationFichier[0].message).toEqual("message 1");
    expect(listeErreursValidationFichier[0].numero_de_ligne).toEqual(1);
    expect(listeErreursValidationFichier[0].position_de_ligne).toEqual(0);
    expect(listeErreursValidationFichier[0].nom_du_champ).toEqual(
      "nom du champ 1",
    );
    expect(listeErreursValidationFichier[0].position_du_champ).toEqual(1);

    expect(listeErreursValidationFichier[1].cellule).toEqual("cellule 2");
    expect(listeErreursValidationFichier[1].nom).toEqual("nom 2");
    expect(listeErreursValidationFichier[1].message).toEqual("message 2");
    expect(listeErreursValidationFichier[1].numero_de_ligne).toEqual(2);
    expect(listeErreursValidationFichier[1].position_de_ligne).toEqual(1);
    expect(listeErreursValidationFichier[1].nom_du_champ).toEqual(
      "nom du champ 2",
    );
    expect(listeErreursValidationFichier[1].position_du_champ).toEqual(2);
  });
});
```

- [ ] **Step 2: Demander à l'utilisateur de lancer le test et vérifier qu'il passe**

Commande : `pnpm test:server:integration -- src/server/import-indicateur/__tests__/infrastructure/handlers/VerifierImportIndicateurHandler.integration.test.ts`
Attendu : PASS (5 tests).

- [ ] **Step 3: Réécrire `ImportDonneeIndicateurAPIHandler.integration.test.ts`**

Ce fichier a la même structure de mock (à copier telle quelle en tête de fichier : `validerFichierMock`, `vi.mock(".../LocalFichierIndicateurValidationService", ...)`, retrait de `nock`/`BASE_URL_VALIDATA`) et 8 tests répartis en 2 describe ("quand on import un fichier via une donnee en JSON" / "... en CSV"), chacun étant une variation des 4 scénarios déjà réécrits ci-dessus (invalide+réponse, invalide+sauvegarde, règle DITP indic_id mismatch, valide+import). Appliquer pour chacun des 8 `it(...)` la même transformation que dans le Step 1, en réutilisant exactement les valeurs déjà présentes dans le fichier actuel (cell/message/rowNumber/resourceData) :

- Remplacer le bloc `new ReportValidataWithDataBuilder()...build(); nock(BASE_URL_VALIDATA)...` par un appel `validerFichierMock.mockResolvedValue(new DetailValidationFichierBuilder()...build())`, selon la table de correspondance ci-dessus.
- Pour le scénario "règle DITP <<indic_id request different des indic_id dans fichier>>" (ex. lignes 253-346 et son équivalent CSV) : le rapport mocké doit être `estValide(true)` avec 3 `MesureIndicateurTemporaireBuilder` ayant `avecIndicId("IND-002")` (les valeurs de zone/date/type/valeur déjà présentes dans le fichier actuel) — c'est `VerifierFichierIndicateurImporteUseCase` (inchangé) qui détecte lui-même le mismatch avec l'`indicateurId` de la requête (`IND-001`) et génère les 3 erreurs "Indicateur invalide" attendues ; ne pas construire ces erreurs dans le mock.
- Pour le scénario "quand le fichier est valide, doit importer les données" (JSON et CSV) : le rapport mocké est `estValide(true)` avec les `MesureIndicateurTemporaireBuilder` correspondant aux lignes déjà présentes dans le fichier actuel (`IND-001`/`D12`/`D13`/`D14`).
- Conserver telles quelles toutes les sections `// Given` de préparation de données (création de `chantier_identite`, `territoire`, etc.) et toutes les assertions `// Then` — seule la construction du mock de validation change.

- [ ] **Step 4: Demander à l'utilisateur de lancer le test et vérifier qu'il passe**

Commande : `pnpm test:server:integration -- src/server/import-indicateur/__tests__/infrastructure/handlers/ImportDonneeIndicateurAPIHandler.integration.test.ts`
Attendu : PASS (8 tests).

- [ ] **Step 5: Demander à l'utilisateur de lancer la suite serveur complète**

Commande : `pnpm test:server`
Attendu : PASS (aucune régression ailleurs, notamment aucune référence résiduelle à `nock`/`BASE_URL_VALIDATA` dans `import-indicateur`).

- [ ] **Step 6: Retirer la dépendance `nock` si elle n'est plus utilisée nulle part ailleurs**

```bash
cd /Users/tristanconti/Documents/pilote-2/apps/pilote-ppg
grep -rl "from \"nock\"" src | grep -v node_modules
```

Si la commande ne retourne aucun résultat, retirer `nock` de `package.json` :

```bash
pnpm remove nock
```

Sinon, laisser la dépendance (encore utilisée ailleurs).

- [ ] **Step 7: Commit**

```bash
cd /Users/tristanconti/Documents/pilote-2
git add apps/pilote-ppg/src/server/import-indicateur/__tests__/infrastructure/handlers/VerifierImportIndicateurHandler.integration.test.ts \
        apps/pilote-ppg/src/server/import-indicateur/__tests__/infrastructure/handlers/ImportDonneeIndicateurAPIHandler.integration.test.ts \
        apps/pilote-ppg/package.json apps/pilote-ppg/pnpm-lock.yaml
git commit -m "test(ppg-import): migre les tests d'intégration des handlers du mock HTTP Validata au mock du port local"
```

---

## Après l'implémentation

- Tester manuellement en local (préprod si possible) l'import avec le fichier réel ayant déclenché l'incident (`template_import_PILOTE (2).xlsx`), pour lever le risque de parité XLSX identifié dans la spec.
- Vérifier qu'aucune variable d'environnement `URL_VALIDATA` / `NEXT_PUBLIC_SCHEMA_VALIDATA_URL` n'est référencée dans un manifeste de déploiement externe à ce repo avant de les retirer des environnements de production.
