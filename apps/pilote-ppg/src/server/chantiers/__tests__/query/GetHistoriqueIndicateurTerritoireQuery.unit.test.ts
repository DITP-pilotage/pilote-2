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
      valeur: overrides.valeur === undefined ? 10 : overrides.valeur,
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
            description:
              "Import direct par la direction de projet : première valeur d'avancement enregistrée pour cette date. Nouvelle valeur affichée dans PILOTE : 10.",
            categorie: "IMPORT",
          },
          {
            ordre: 2,
            date_creation: expect.stringMatching(/^15\/01\/2024 \d{2}:\d{2}$/),
            description:
              "Import direct par la direction de projet : la valeur d'avancement affichée dans PILOTE a été remplacée. Nouvelle valeur affichée dans PILOTE : 20.",
            categorie: "IMPORT",
          },
        ],
      },
    ]);
    const libellesJson = JSON.stringify(result.groupes);
    expect(libellesJson).not.toContain("VALEUR_CREEE");
    expect(libellesJson).not.toContain("VALEUR_MODIFIEE");
  });

  it("ordonne les groupes chronologiquement, du plus ancien au plus récent", async () => {
    // Given
    const evenementRecent = creerEvenement({
      dateValeur: new Date("2024-06-01"),
      ordre: 3,
    });
    const evenementAncien = creerEvenement({
      dateValeur: new Date("2020-01-01"),
      ordre: 1,
    });
    const evenementIntermediaire = creerEvenement({
      dateValeur: new Date("2022-03-01"),
      ordre: 2,
    });
    const indicateurTerritoireValeurEvenementRepository =
      mock<IndicateurTerritoireValeurEvenementRepository>({
        recupererHistoriqueParIndicIdEtTerritoireCode: async () => [
          evenementRecent,
          evenementAncien,
          evenementIntermediaire,
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
    expect(result.groupes.map((groupe) => groupe.date_valeur)).toEqual([
      "01/2020",
      "03/2022",
      "06/2024",
    ]);
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

  describe("libellés Albert par type d'événement", () => {
    it.each`
      typeEvenement                                      | valeur  | description                                                                                                                                                                                                                                                         | categorie
      ${"VALEUR_CREEE"}                                  | ${42}   | ${"Import direct par la direction de projet : première valeur d'avancement enregistrée pour cette date. Nouvelle valeur affichée dans PILOTE : 42."}                                                                                                                | ${"IMPORT"}
      ${"VALEUR_MODIFIEE"}                               | ${42}   | ${"Import direct par la direction de projet : la valeur d'avancement affichée dans PILOTE a été remplacée. Nouvelle valeur affichée dans PILOTE : 42."}                                                                                                             | ${"IMPORT"}
      ${"VALEUR_MODIFIEE"}                               | ${null} | ${"Import direct par la direction de projet : la valeur d'avancement a été supprimée de PILOTE pour cette date."}                                                                                                                                                   | ${"IMPORT"}
      ${"VALEUR_HISTORISEE"}                             | ${null} | ${"Import direct par la direction de projet : une valeur d'avancement plus récente a été importée."}                                                                                                                                                                | ${"IMPORT"}
      ${"PROPOSITION_VALEUR_CREEE"}                      | ${15}   | ${"Le territoire propose une nouvelle valeur d'avancement, en attente de traitement par la direction de projet. Valeur proposée : 15."}                                                                                                                             | ${"PROPOSITION"}
      ${"PROPOSITION_VALEUR_CREEE"}                      | ${null} | ${"Le territoire propose une nouvelle valeur d'avancement, en attente de traitement par la direction de projet. Valeur proposée : N/A."}                                                                                                                            | ${"PROPOSITION"}
      ${"PROPOSITION_VALEUR_MODIFIEE"}                   | ${20}   | ${"Le territoire modifie sa proposition de valeur d'avancement, toujours en attente de traitement par la direction de projet. Nouvelle valeur proposée : 20."}                                                                                                      | ${"PROPOSITION"}
      ${"PROPOSITION_VALEUR_SUPPRIMEE"}                  | ${null} | ${"Le territoire retire sa proposition de valeur d'avancement avant tout traitement par la direction de projet."}                                                                                                                                                   | ${"PROPOSITION"}
      ${"PROPOSITION_VALEUR_ACCUSEE_RECEPTION"}          | ${null} | ${"La direction de projet accuse réception de la proposition du territoire : elle est prise en compte, mais pas encore acceptée ni refusée."}                                                                                                                       | ${"PROPOSITION"}
      ${"PROPOSITION_VALEUR_REFUSEE"}                    | ${null} | ${"La direction de projet refuse la proposition du territoire : la valeur affichée dans PILOTE ne change pas."}                                                                                                                                                     | ${"PROPOSITION"}
      ${"PROPOSITION_VALEUR_ACCEPTEE"}                   | ${30}   | ${"La direction de projet accepte la proposition du territoire telle quelle. Nouvelle valeur affichée dans PILOTE : 30."}                                                                                                                                           | ${"PROPOSITION"}
      ${"PROPOSITION_VALEUR_ACCEPTEE_AVEC_MODIFICATION"} | ${35}   | ${"La direction de projet accepte la proposition du territoire en corrigeant sa valeur. Nouvelle valeur affichée dans PILOTE : 35."}                                                                                                                                | ${"PROPOSITION"}
      ${"PROPOSITION_VALEUR_IGNOREE_VALEUR_MODIFIEE"}    | ${12}   | ${"Un import direct par la direction de projet a pris le pas sur la proposition du territoire en cours pour cette date : elle est automatiquement écartée, sans validation. Nouvelle valeur affichée dans PILOTE : 12."}                                            | ${"IMPORT"}
      ${"PROPOSITION_VALEUR_IGNOREE_VALEUR_MODIFIEE"}    | ${null} | ${"Un import direct par la direction de projet a pris le pas sur la proposition du territoire en cours pour cette date : elle est automatiquement écartée, sans validation. La valeur a été supprimée de PILOTE."}                                                  | ${"IMPORT"}
      ${"PROPOSITION_VALEUR_IGNOREE_VALEUR_HISTORISEE"}  | ${null} | ${"Une valeur d'avancement plus récente a été importée pour une date ultérieure, ce qui rend obsolète la proposition du territoire en cours sur cette date : elle est automatiquement écartée, sans validation, sans changer la valeur déjà affichée dans PILOTE."} | ${"IMPORT"}
    `(
      "$typeEvenement (valeur=$valeur) : description et catégorie attendues",
      async ({ typeEvenement, valeur, description, categorie }) => {
        // Given
        const evenement = creerEvenement({ typeEvenement, valeur });
        const indicateurTerritoireValeurEvenementRepository =
          mock<IndicateurTerritoireValeurEvenementRepository>({
            recupererHistoriqueParIndicIdEtTerritoireCode: async () => [
              evenement,
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
        expect(result.groupes[0].evenements[0]).toEqual({
          ordre: 1,
          date_creation: expect.stringMatching(/^15\/01\/2024 \d{2}:\d{2}$/),
          description,
          categorie,
        });
      },
    );
  });
});
