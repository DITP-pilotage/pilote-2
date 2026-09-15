import { mock } from "vitest-mock-extended";
import { GetHistoriqueIndicateurTerritoireQuery } from "@/server/chantiers/query/GetHistoriqueIndicateurTerritoireQuery";
import type { IndicateurTerritoireValeurEvenementRepository } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/IndicateurTerritoireValeurEvenementRepository";
import { IndicateurTerritoireValeurEvenement } from "@/server/indicateur-territoire-valeur-evenement/domain/IndicateurTerritoireValeurEvenement";
import { TypeEvenement } from "@/server/indicateur-territoire-valeur-evenement/domain/TypeEvenement";

const creerEvenement = (
  overrides: Partial<{
    typeEvenement: TypeEvenement;
    valeur: number | null;
    ordre: number;
    dateValeur: Date;
    dateCreation: Date;
  }> = {},
): IndicateurTerritoireValeurEvenement =>
  IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
    {
      indicId: "IND-001",
      territoireCode: "DEPT-75",
      typeEvenement: overrides.typeEvenement ?? "VALEUR_CREEE",
      typeValeur: "VALEUR_AVANCEMENT",
      dateValeur: overrides.dateValeur ?? new Date("2024-01-01"),
      valeur: overrides.valeur ?? 10,
      donneesComplementaires: undefined,
      idAuteurModification: "user1",
      correlationId: "corr1",
      ordre: overrides.ordre ?? 1,
      dateCreation:
        overrides.dateCreation ?? new Date("2024-01-15T12:00:00.000Z"),
    },
  );

describe("GetHistoriqueIndicateurTerritoireQuery execute", () => {
  it("retourne un résultat vide quand aucun événement ne correspond", async () => {
    // Given
    const indicateurTerritoireValeurEvenementRepository =
      mock<IndicateurTerritoireValeurEvenementRepository>({
        recupererHistoriqueParIndicIdEtTerritoireCode: async () => [],
      });
    const query = new GetHistoriqueIndicateurTerritoireQuery({
      indicateurTerritoireValeurEvenementRepository,
    });

    // When
    const result = await query.execute({
      indicId: "IND-001",
      territoireCode: "DEPT-75",
    });

    // Then
    expect(result).toEqual({
      nombreEvenements: 0,
      dateMin: null,
      dateMax: null,
      groupes: [],
    });
  });

  it("calcule le nombre d'événements et les bornes de dates à partir des événements récupérés", async () => {
    // Given
    const evenements = [
      creerEvenement({ dateValeur: new Date("2020-01-01"), ordre: 1 }),
      creerEvenement({ dateValeur: new Date("2024-06-01"), ordre: 2 }),
      creerEvenement({ dateValeur: new Date("2022-03-01"), ordre: 3 }),
    ];
    const indicateurTerritoireValeurEvenementRepository =
      mock<IndicateurTerritoireValeurEvenementRepository>({
        recupererHistoriqueParIndicIdEtTerritoireCode: async () => evenements,
      });
    const query = new GetHistoriqueIndicateurTerritoireQuery({
      indicateurTerritoireValeurEvenementRepository,
    });

    // When
    const result = await query.execute({
      indicId: "IND-001",
      territoireCode: "DEPT-75",
    });

    // Then
    expect(result.nombreEvenements).toBe(3);
    expect(result.dateMin).toBe("2020-01-01");
    expect(result.dateMax).toBe("2024-06-01");
  });

  it("groupe par date_valeur, ordonne par ordre croissant et mappe des libellés humains sans type_evenement brut", async () => {
    // Given
    const evenementCree = creerEvenement({
      typeEvenement: "VALEUR_CREEE",
      valeur: 10,
      ordre: 1,
      dateValeur: new Date("2024-01-01"),
    });
    const evenementModifie = creerEvenement({
      typeEvenement: "VALEUR_MODIFIEE",
      valeur: 20,
      ordre: 2,
      dateValeur: new Date("2024-01-01"),
    });
    const indicateurTerritoireValeurEvenementRepository =
      mock<IndicateurTerritoireValeurEvenementRepository>({
        recupererHistoriqueParIndicIdEtTerritoireCode: async () => [
          evenementModifie,
          evenementCree,
        ],
      });
    const query = new GetHistoriqueIndicateurTerritoireQuery({
      indicateurTerritoireValeurEvenementRepository,
    });

    // When
    const result = await query.execute({
      indicId: "IND-001",
      territoireCode: "DEPT-75",
    });

    // Then
    expect(result.groupes).toEqual([
      {
        date_valeur: "01/2024",
        evenements: [
          {
            ordre: 1,
            date_creation: expect.stringMatching(/^15\/01\/2024 \d{2}:\d{2}$/),
            libelle: "→ nouvelle valeur affichée dans PILOTE : 10",
            type_valeur: "VALEUR_AVANCEMENT",
          },
          {
            ordre: 2,
            date_creation: expect.stringMatching(/^15\/01\/2024 \d{2}:\d{2}$/),
            libelle:
              "import de données par la direction de projet → nouvelle valeur affichée dans PILOTE : 20",
            type_valeur: "VALEUR_AVANCEMENT",
          },
        ],
      },
    ]);
    const libellesJson = JSON.stringify(result.groupes);
    expect(libellesJson).not.toContain("VALEUR_CREEE");
    expect(libellesJson).not.toContain("VALEUR_MODIFIEE");
  });

  it("transmet les filtres (dates, types d'événement) au repository", async () => {
    // Given
    const indicateurTerritoireValeurEvenementRepository =
      mock<IndicateurTerritoireValeurEvenementRepository>({
        recupererHistoriqueParIndicIdEtTerritoireCode: vi.fn(async () => []),
      });
    const query = new GetHistoriqueIndicateurTerritoireQuery({
      indicateurTerritoireValeurEvenementRepository,
    });
    const dateDebut = new Date("2024-01-01");
    const dateFin = new Date("2024-12-31");

    // When
    await query.execute({
      indicId: "IND-001",
      territoireCode: "DEPT-75",
      dateDebut,
      dateFin,
      typesEvenement: ["PROPOSITION_VALEUR_CREEE"],
    });

    // Then
    expect(
      indicateurTerritoireValeurEvenementRepository.recupererHistoriqueParIndicIdEtTerritoireCode,
    ).toHaveBeenCalledWith({
      indicId: "IND-001",
      territoireCode: "DEPT-75",
      dateDebut,
      dateFin,
      typesEvenement: ["PROPOSITION_VALEUR_CREEE"],
    });
  });
});
