import { compilerSchema } from "@/server/infrastructure/table-schema/compilerSchema";
import type { TableSchemaBrut } from "@/server/infrastructure/table-schema/TableSchema.types";
import { validerLignes } from "@/server/infrastructure/table-schema/validerLignes";

const ENTETES = [
  "identifiant_indic",
  "zone_id",
  "date_valeur",
  "type_valeur",
  "valeur",
];

const BRUT: TableSchemaBrut = {
  name: "test",
  fields: [
    {
      name: "identifiant_indic",
      type: "string",
      constraints: { required: true, pattern: "^IND-([0-9]{3,4})$" },
    },
    { name: "zone_id", type: "string", constraints: { required: true } },
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

const schema = compilerSchema(BRUT, ENTETES);
const valider = (lignes: string[][]) =>
  validerLignes(schema, lignes).violations;

describe("validerLignes", () => {
  it("ne signale rien sur une ligne conforme", () => {
    expect(valider([["IND-001", "D46", "2023-01-31", "vi", "12.5"]])).toEqual(
      [],
    );
  });

  it("signale une cellule requise vide", () => {
    expect(valider([["", "D46", "2023-01-31", "vi", "1"]])[0]).toMatchObject({
      type: "required",
      nomDuChamp: "identifiant_indic",
      indexDeLigne: 0,
    });
  });

  it("signale un motif non respecté", () => {
    expect(
      valider([["IND-XXX", "D46", "2023-01-31", "vi", "1"]])[0],
    ).toMatchObject({ type: "pattern", cellule: "IND-XXX" });
  });

  it("signale une valeur hors énumération", () => {
    expect(
      valider([["IND-001", "D46", "2023-01-31", "zz", "1"]])[0],
    ).toMatchObject({ type: "enum", nomDuChamp: "type_valeur" });
  });

  it("signale une valeur non numérique", () => {
    expect(
      valider([["IND-001", "D46", "2023-01-31", "vi", "abc"]])[0],
    ).toMatchObject({ type: "type", nomDuChamp: "valeur" });
  });

  it("refuse la virgule comme séparateur décimal", () => {
    expect(
      valider([["IND-001", "D46", "2023-01-31", "vi", "12,5"]])[0],
    ).toMatchObject({ type: "type" });
  });

  it.each(["1e5", "+5", "-3", "12.5", "7"])(
    "accepte %s comme nombre",
    (nombre) => {
      const sansBornes = compilerSchema(
        {
          ...BRUT,
          fields: BRUT.fields.map((champ) =>
            champ.name === "valeur"
              ? { ...champ, constraints: { required: false } }
              : champ,
          ),
        },
        ENTETES,
      );

      expect(
        validerLignes(sansBornes, [
          ["IND-001", "D46", "2023-01-31", "vi", nombre],
        ]).violations,
      ).toEqual([]);
    },
  );

  it("signale le dépassement des bornes", () => {
    expect(
      valider([["IND-001", "D46", "2023-01-31", "vi", "150"]])[0],
    ).toMatchObject({ type: "maximum" });
    expect(
      valider([["IND-001", "D46", "2023-01-31", "vi", "-1"]])[0],
    ).toMatchObject({ type: "minimum" });
  });

  it("ne signale rien pour une cellule vide sur un champ non requis", () => {
    expect(valider([["IND-001", "D46", "2023-01-31", "vi", ""]])).toEqual([]);
  });

  it("signale une ligne plus courte que le schéma", () => {
    expect(valider([["IND-001", "D46", "2023-01-31", "vi"]])[0]).toMatchObject({
      type: "missing-cell",
      nomDuChamp: "valeur",
    });
  });

  it("signale un doublon de clé primaire sur la seconde occurrence seulement", () => {
    const violations = valider([
      ["IND-001", "D46", "2023-01-31", "vi", "1"],
      ["IND-001", "D46", "2023-01-31", "vi", "2"],
    ]);

    expect(
      violations.map(({ type, indexDeLigne }) => ({ type, indexDeLigne })),
    ).toEqual([{ type: "primary-key", indexDeLigne: 1 }]);
  });

  it("signale une ligne entièrement vide par deux violations", () => {
    expect(valider([["", "", "", "", ""]]).map((v) => v.type)).toEqual([
      "blank-row",
      "primary-key",
    ]);
  });

  it("ignore un champ du schéma absent du fichier", () => {
    const partiel = compilerSchema(BRUT, [
      "identifiant_indic",
      "zone_id",
      "date_valeur",
      "type_valeur",
    ]);

    expect(
      validerLignes(partiel, [["IND-001", "D46", "2023-01-31", "vi"]])
        .violations,
    ).toEqual([]);
  });

  it("s'arrête au plafond et signale la troncature", () => {
    const lignes = Array.from({ length: 50 }, () => [
      "MAUVAIS",
      "",
      "",
      "zz",
      "abc",
    ]);

    const resultat = validerLignes(schema, lignes, 10);

    expect(resultat.violations).toHaveLength(10);
    expect(resultat.tronque).toBe(true);
  });
});
