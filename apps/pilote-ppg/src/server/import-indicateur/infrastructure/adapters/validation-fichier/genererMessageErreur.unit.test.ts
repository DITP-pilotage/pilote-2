import { chargerSchemaBrut } from "@/server/import-indicateur/infrastructure/adapters/validation-fichier/SchemaRepository";
import {
  genererMessageErreur,
  libelleTypeErreur,
} from "@/server/import-indicateur/infrastructure/adapters/validation-fichier/genererMessageErreur";
import { compileSchema } from "@/server/import-indicateur/infrastructure/adapters/validation-fichier/table-schema/compileSchema";
import type { ViolationContrainte } from "@/server/import-indicateur/infrastructure/adapters/validation-fichier/table-schema/TableSchema.types";

const COLONNES = [
  "identifiant_indic",
  "zone_id",
  "date_valeur",
  "type_valeur",
  "valeur",
];

const schema = compileSchema(
  chargerSchemaBrut("sans-contraintes.json"),
  COLONNES,
);

const message = (violation: ViolationContrainte, numeroDeLigne = 2) =>
  genererMessageErreur(violation, schema, numeroDeLigne);

describe("genererMessageErreur", () => {
  it("cite la valeur fautive et un exemple concret, jamais un gabarit", () => {
    const texte = message({
      type: "pattern",
      nomDuChamp: "identifiant_indic",
      indexDeColonne: 0,
      cellule: "IND-XXX",
      indexDeLigne: 0,
    });

    // Le piège : dire « mettez du IND-XXX » à quelqu'un qui a écrit IND-XXX.
    expect(texte).toContain("'IND-XXX' n'est pas un identifiant");
    expect(texte).toContain("3 ou 4 chiffres");
    expect(texte).toContain("Exemple attendu : IND-001.");
  });

  it("tire l'exemple du schéma plutôt que de le coder en dur", () => {
    expect(
      message({
        type: "pattern",
        nomDuChamp: "zone_id",
        indexDeColonne: 1,
        cellule: "ZZZ",
        indexDeLigne: 0,
      }),
    ).toContain("Exemple attendu : D46.");

    expect(
      message({
        type: "pattern",
        nomDuChamp: "date_valeur",
        indexDeColonne: 2,
        cellule: "pas-une-date",
        indexDeLigne: 0,
      }),
    ).toContain("Exemple attendu : 2023-01-31.");
  });

  it("situe l'erreur à la ligne du tableur", () => {
    expect(
      message(
        {
          type: "primary-key",
          nomDuChamp: null,
          indexDeColonne: -1,
          cellule: null,
          indexDeLigne: 5,
        },
        7,
      ),
    ).toContain("La ligne 7");
  });

  it("n'affiche jamais de markdown ni d'expression régulière", () => {
    const types = [
      "required",
      "pattern",
      "enum",
      "type",
      "minimum",
      "maximum",
      "blank-row",
      "primary-key",
      "missing-cell",
    ] as const;

    for (const type of types) {
      const texte = message({
        type,
        nomDuChamp: "valeur",
        indexDeColonne: 4,
        cellule: "x",
        indexDeLigne: 0,
      });
      expect(texte).not.toMatch(/\*\*|\^|\\d|\[0-9\]/);
    }
  });
});

describe("message sur la zone", () => {
  const zoneRefusee = (nomDuSchema: string, zone: string) =>
    genererMessageErreur(
      {
        type: "pattern",
        nomDuChamp: "zone_id",
        indexDeColonne: 1,
        cellule: zone,
        indexDeLigne: 0,
      },
      compileSchema(chargerSchemaBrut(nomDuSchema), COLONNES),
      2,
    );

  it("dit qu'une région est refusée par un indicateur départemental", () => {
    expect(zoneRefusee("restrict-dept.json", "R84")).toEqual(
      "La zone 'R84' est une zone régionale, or cet indicateur ne peut être renseigné qu'à la maille départementale (ligne 2). Exemple attendu : D46.",
    );
  });

  it("dit qu'un département est refusé par un indicateur régional", () => {
    expect(zoneRefusee("restrict-reg.json", "D46")).toEqual(
      "La zone 'D46' est une zone départementale, or cet indicateur ne peut être renseigné qu'à la maille régionale (ligne 2). Exemple attendu : R84.",
    );
  });

  it("refuse aussi la maille nationale sur un indicateur départemental", () => {
    expect(zoneRefusee("restrict-dept.json", "FRANCE")).toContain(
      "est une zone nationale",
    );
  });

  it("parle de référentiel, pas de maille, quand le code est inconnu", () => {
    // 'ZZZ' ne porte aucune maille : ce n'est pas un problème d'échelle.
    expect(zoneRefusee("restrict-dept.json", "ZZZ")).toEqual(
      "La zone 'ZZZ' n'est pas dans le référentiel des territoires (ligne 2). Exemple attendu : D46.",
    );
  });

  it("ne parle jamais de maille quand le schéma les accepte toutes", () => {
    for (const zone of ["R84", "D46", "FRANCE", "ZZZ"]) {
      expect(zoneRefusee("sans-contraintes.json", zone)).not.toContain(
        "maille",
      );
    }
  });
});

describe("libelleTypeErreur", () => {
  const TOUS_LES_TYPES = [
    "required",
    "pattern",
    "enum",
    "type",
    "minimum",
    "maximum",
    "primary-key",
    "blank-row",
    "missing-cell",
  ] as const;

  it("donne un libellé français à chaque type de violation", () => {
    expect(
      Object.fromEntries(
        TOUS_LES_TYPES.map((type) => [type, libelleTypeErreur(type)]),
      ),
    ).toEqual({
      required: "Cellule obligatoire vide",
      pattern: "Format incorrect",
      enum: "Valeur non autorisée",
      type: "Valeur non numérique",
      minimum: "Valeur trop petite",
      maximum: "Valeur trop grande",
      "primary-key": "Ligne en double",
      "blank-row": "Ligne vide",
      "missing-cell": "Colonne manquante",
    });
  });

  it("ne laisse jamais fuir le type interne à l'écran", () => {
    for (const type of TOUS_LES_TYPES) {
      expect(libelleTypeErreur(type)).not.toContain("-");
      expect(libelleTypeErreur(type)).not.toEqual(type);
    }
  });
});
