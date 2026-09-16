import { compilerSchema } from "@/server/infrastructure/table-schema/compilerSchema";
import type { TableSchemaBrut } from "@/server/infrastructure/table-schema/TableSchema.types";

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

describe("compilerSchema", () => {
  it("résout l'index de chaque colonne d'après les en-têtes du fichier", () => {
    const compile = compilerSchema(SCHEMA_BRUT, [
      "zone_id",
      "identifiant_indic",
      "type_valeur",
      "valeur",
    ]);

    expect(compile.champs.map((c) => c.indexDeColonne)).toEqual([1, 2, 3]);
  });

  it("marque à -1 un champ du schéma absent du fichier", () => {
    const compile = compilerSchema(SCHEMA_BRUT, [
      "identifiant_indic",
      "type_valeur",
    ]);

    expect(compile.champs[2].indexDeColonne).toBe(-1);
    expect(compile.colonnesClePrimaireAbsentes).toEqual([]);
  });

  it("signale séparément une colonne de clé primaire absente", () => {
    const compile = compilerSchema(SCHEMA_BRUT, ["type_valeur", "valeur"]);

    expect(compile.colonnesClePrimaireAbsentes).toEqual(["identifiant_indic"]);
    expect(compile.indexColonnesClePrimaire).toEqual([0]);
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

  it("résout les colonnes en ignorant la casse et les espaces de l'en-tête", () => {
    const compile = compilerSchema(SCHEMA_BRUT, [
      " IDENTIFIANT_INDIC ",
      "type_valeur",
    ]);

    expect(compile.champs[0].indexDeColonne).toBe(0);
  });
});
