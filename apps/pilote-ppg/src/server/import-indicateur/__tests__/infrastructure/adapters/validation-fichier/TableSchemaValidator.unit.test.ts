import {
  validerContraintesDeChamp,
  detecterViolationsClePrimaire,
} from "@/server/import-indicateur/infrastructure/adapters/validation-fichier/TableSchemaValidator";
import { TableSchema } from "@/server/import-indicateur/infrastructure/adapters/validation-fichier/TableSchema.types";

export const SCHEMA_DE_TEST: TableSchema = {
  fields: [
    {
      name: "identifiant_indic",
      type: "string",
      constraints: { required: true, pattern: "^IND-([0-9]{3,4})$" },
    },
    {
      name: "zone_id",
      type: "string",
      constraints: { required: true, pattern: "^(D[0-9]{2}|R[0-9]{2})$" },
    },
    { name: "date_valeur", type: "string", constraints: { required: true } },
    {
      name: "type_valeur",
      type: "string",
      constraints: { required: true, enum: ["vi", "va", "vc"] },
    },
    {
      name: "valeur",
      type: "number",
      constraints: { required: false, minimum: 0, maximum: 100 },
    },
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
    const violations = validerContraintesDeChamp(
      SCHEMA_DE_TEST,
      ENTETES_DE_TEST,
      [["IND-001", "D001", "2023-01-31", "vi", "9"]],
    );
    expect(violations).toEqual([]);
  });

  it("doit remonter une violation 'required' quand un champ obligatoire est vide", () => {
    const violations = validerContraintesDeChamp(
      SCHEMA_DE_TEST,
      ENTETES_DE_TEST,
      [["", "D001", "2023-01-31", "vi", "9"]],
    );
    expect(violations).toEqual([
      {
        type: "required",
        nomDuChamp: "identifiant_indic",
        cellule: "",
        ligneDeDonnees: 0,
      },
    ]);
  });

  it("doit remonter une violation 'pattern' quand la valeur ne respecte pas le format", () => {
    const violations = validerContraintesDeChamp(
      SCHEMA_DE_TEST,
      ENTETES_DE_TEST,
      [["INVALIDE", "D001", "2023-01-31", "vi", "9"]],
    );
    expect(violations).toEqual([
      {
        type: "pattern",
        nomDuChamp: "identifiant_indic",
        cellule: "INVALIDE",
        ligneDeDonnees: 0,
      },
    ]);
  });

  it("doit remonter une violation 'enum' quand la valeur n'est pas autorisée", () => {
    const violations = validerContraintesDeChamp(
      SCHEMA_DE_TEST,
      ENTETES_DE_TEST,
      [["IND-001", "D001", "2023-01-31", "invalide", "9"]],
    );
    expect(violations).toEqual([
      {
        type: "enum",
        nomDuChamp: "type_valeur",
        cellule: "invalide",
        ligneDeDonnees: 0,
      },
    ]);
  });

  it("doit remonter une violation 'type' quand un champ nombre n'est pas numérique", () => {
    const violations = validerContraintesDeChamp(
      SCHEMA_DE_TEST,
      ENTETES_DE_TEST,
      [["IND-001", "D001", "2023-01-31", "vi", "abc"]],
    );
    expect(violations).toEqual([
      { type: "type", nomDuChamp: "valeur", cellule: "abc", ligneDeDonnees: 0 },
    ]);
  });

  it("doit remonter une violation 'maximum' quand la valeur dépasse le plafond", () => {
    const violations = validerContraintesDeChamp(
      SCHEMA_DE_TEST,
      ENTETES_DE_TEST,
      [["IND-001", "D001", "2023-01-31", "vi", "150"]],
    );
    expect(violations).toEqual([
      {
        type: "maximum",
        nomDuChamp: "valeur",
        cellule: "150",
        ligneDeDonnees: 0,
      },
    ]);
  });

  it("ne doit pas remonter de violation quand un champ non obligatoire est vide", () => {
    const violations = validerContraintesDeChamp(
      SCHEMA_DE_TEST,
      ENTETES_DE_TEST,
      [["IND-001", "D001", "2023-01-31", "vi", ""]],
    );
    expect(violations).toEqual([]);
  });
});

describe("detecterViolationsClePrimaire", () => {
  it("ne doit remonter aucune violation quand toutes les clés sont uniques", () => {
    const violations = detecterViolationsClePrimaire(
      SCHEMA_DE_TEST,
      ENTETES_DE_TEST,
      [
        ["IND-001", "D001", "2023-01-31", "vi", "9"],
        ["IND-001", "D001", "2023-01-31", "vc", "3"],
      ],
    );
    expect(violations).toEqual([]);
  });

  it("doit remonter une violation 'primaryKey-duplicate' pour la seconde ligne ayant la même clé", () => {
    const violations = detecterViolationsClePrimaire(
      SCHEMA_DE_TEST,
      ENTETES_DE_TEST,
      [
        ["IND-001", "D001", "2023-01-31", "vi", "9"],
        ["IND-001", "D001", "2023-01-31", "vi", "3"],
      ],
    );
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
    const violations = detecterViolationsClePrimaire(
      SCHEMA_DE_TEST,
      ENTETES_DE_TEST,
      [["", "", "", "", ""]],
    );
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
