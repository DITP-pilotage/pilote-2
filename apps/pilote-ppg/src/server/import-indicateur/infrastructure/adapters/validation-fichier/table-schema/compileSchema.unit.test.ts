import { compileSchema } from "@/server/import-indicateur/infrastructure/adapters/validation-fichier/table-schema/compileSchema";
import type { TableSchemaBrut } from "@/server/import-indicateur/infrastructure/adapters/validation-fichier/table-schema/TableSchema.types";

const SCHEMA_BRUT: TableSchemaBrut = {
  name: "test",
  fields: [
    {
      name: "identifiant_indic",
      type: "string",
      constraints: { required: true, pattern: "^IND-([0-9]{3,4})$" },
    },
    {
      name: "type_valeur",
      type: "string",
      constraints: { required: true, enum: ["vi", "va"] },
    },
    {
      name: "valeur",
      type: "number",
      constraints: { required: false, minimum: 0, maximum: 100 },
    },
  ],
  primaryKey: ["identifiant_indic", "type_valeur"],
};

describe("compileSchema", () => {
  it("résout l'index de chaque colonne d'après les en-têtes du fichier", () => {
    const compile = compileSchema(SCHEMA_BRUT, [
      "zone_id",
      "identifiant_indic",
      "type_valeur",
      "valeur",
    ]);

    expect(compile.champs.map((champ) => champ.indexDeColonne)).toEqual([
      1, 2, 3,
    ]);
  });

  it("marque à -1 un champ du schéma absent du fichier", () => {
    const compile = compileSchema(SCHEMA_BRUT, [
      "identifiant_indic",
      "type_valeur",
    ]);

    expect(compile.champs[2].indexDeColonne).toBe(-1);
    expect(compile.colonnesClePrimaireAbsentes).toEqual([]);
  });

  it("signale séparément une colonne de clé primaire absente", () => {
    const compile = compileSchema(SCHEMA_BRUT, ["type_valeur", "valeur"]);

    expect(compile.colonnesClePrimaireAbsentes).toEqual(["identifiant_indic"]);
    expect(compile.indexColonnesClePrimaire).toEqual([0]);
  });

  it("compile le motif une seule fois, en RegExp", () => {
    const compile = compileSchema(SCHEMA_BRUT, ["identifiant_indic"]);

    expect(compile.champs[0].motif).toBeInstanceOf(RegExp);
    expect(compile.champs[0].motif!.test("IND-001")).toBe(true);
    expect(compile.champs[0].motif!.test("IND-XXX")).toBe(false);
  });

  it("compile l'énumération en Set", () => {
    const compile = compileSchema(SCHEMA_BRUT, ["type_valeur"]);

    expect(compile.champs[1].valeursAutorisees).toBeInstanceOf(Set);
    expect(compile.champs[1].valeursAutorisees!.has("vi")).toBe(true);
  });

  it("résout les colonnes en ignorant la casse et les espaces de l'en-tête", () => {
    const compile = compileSchema(SCHEMA_BRUT, [
      " IDENTIFIANT_INDIC ",
      "type_valeur",
    ]);

    expect(compile.champs[0].indexDeColonne).toBe(0);
  });

  it("ancre le motif sur la valeur entière, même quand il porte une alternation", () => {
    // Table Schema veut qu'un motif décrive la valeur entière. Le motif des
    // dates porte trois branches et ses `^`/`$` ne couvrent que la première et
    // la dernière : sans ancrage ajouté, la branche du milieu accepte tout ce
    // qui l'entoure.
    const motifDesDates =
      "^(20[0-9]{2}-(0?[0-9]|1[012])-([0-2]?[0-9]|3[01]))|(([0-2]?[0-9]|3[01])\\/(0?[0-9]|1[012])\\/(20)?[0-9]{2})|(0?[0-9]|1[012])-([0-2]?[0-9]|3[01])-([0-9]{2})$";

    const schema = compileSchema(
      {
        name: "dates",
        fields: [
          {
            name: "date_valeur",
            type: "string",
            constraints: { pattern: motifDesDates },
          },
        ],
        primaryKey: ["date_valeur"],
      },
      ["date_valeur"],
    );
    const motif = schema.champs[0].motif!;

    expect(motif.test("2023-01-31")).toBe(true);
    expect(motif.test("31/12/2023")).toBe(true);
    expect(motif.test("2023-01-31 et du texte")).toBe(false);
    expect(motif.test("du texte 31/12/2023 du texte")).toBe(false);
  });
});
