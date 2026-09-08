import {
  LigneDernierImportParTerritoire,
  regrouperDerniersImportsParIndicateur,
} from "@/server/chantiers/infrastructure/regrouperDerniersImportsParIndicateur";

const creerLigne = (
  overrides: Partial<LigneDernierImportParTerritoire> = {},
): LigneDernierImportParTerritoire => ({
  indic_id: "IND-001",
  territoire_code: "DEPT-75",
  type_evenement: "VALEUR_CREEE",
  _max: { date_creation: new Date("2026-01-15") },
  ...overrides,
});

describe("regrouperDerniersImportsParIndicateur", () => {
  it("regroupe les dates de dernier import par indicateur", () => {
    // Given
    const lignes = [
      creerLigne({ indic_id: "IND-001", territoire_code: "DEPT-75" }),
      creerLigne({ indic_id: "IND-001", territoire_code: "DEPT-92" }),
      creerLigne({ indic_id: "IND-002", territoire_code: "REG-11" }),
    ];

    // When
    const resultat = regrouperDerniersImportsParIndicateur(lignes);

    // Then
    expect(resultat.get("IND-001")).toHaveLength(2);
    expect(resultat.get("IND-002")).toHaveLength(1);
  });

  it("conserve le territoire, le type d'événement et la date maximale de chaque agrégat", () => {
    // Given
    const lignes = [
      creerLigne({
        territoire_code: "REG-11",
        type_evenement: "VALEUR_MODIFIEE",
        _max: { date_creation: new Date("2026-03-20") },
      }),
    ];

    // When
    const resultat = regrouperDerniersImportsParIndicateur(lignes);

    // Then
    expect(resultat.get("IND-001")).toEqual([
      {
        territoire_code: "REG-11",
        type_evenement: "VALEUR_MODIFIEE",
        date_creation: new Date("2026-03-20"),
      },
    ]);
  });

  it("ignore les agrégats sans date", () => {
    // Given
    const lignes = [creerLigne({ _max: { date_creation: null } })];

    // When
    const resultat = regrouperDerniersImportsParIndicateur(lignes);

    // Then
    expect(resultat.has("IND-001")).toBe(false);
  });

  it("retourne une map vide quand aucun import n'est remonté", () => {
    // When
    const resultat = regrouperDerniersImportsParIndicateur([]);

    // Then
    expect(resultat.size).toBe(0);
  });
});
