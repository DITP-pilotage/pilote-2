import { mock } from "vitest-mock-extended";
import {
  createGetHistoriqueIndicateurTool,
  getHistoriqueIndicateurInputSchema,
  type GetHistoriqueIndicateurOutput,
} from "@/server/albert/tools/getHistoriqueIndicateur";
import type { GetIndicateurContexteQuery } from "@/server/chantiers/query/GetIndicateurContexteQuery";
import type { GetHistoriqueIndicateurTerritoireQuery } from "@/server/chantiers/query/GetHistoriqueIndicateurTerritoireQuery";
import type { GetEvolutionIndicateurTerritoireQuery } from "@/server/chantiers/query/GetEvolutionIndicateurTerritoireQuery";

const contexteParDefaut = {
  id: "IND-001",
  nom: "Indicateur test",
  description: null,
  uniteMesure: "%",
  chantier: { id: "CH-001", nom: "Chantier test" },
  mailleNatAgregee: false,
  mailleRegAgregee: false,
  explicationValeurAffichee: null,
};

const executeTool = async (
  tool: ReturnType<ReturnType<typeof createGetHistoriqueIndicateurTool>>,
  input: {
    indicateur_id: string;
    territoire_code: string;
    date_debut?: string;
    date_fin?: string;
    type_filtre?: "TOUS" | "PROPOSITIONS";
  },
): Promise<GetHistoriqueIndicateurOutput> =>
  tool.execute!(getHistoriqueIndicateurInputSchema.parse(input), {
    toolCallId: "test",
    messages: [],
    abortSignal: undefined,
    context: {},
  }) as Promise<GetHistoriqueIndicateurOutput>;

describe("getHistoriqueIndicateurInputSchema", () => {
  it.each(["2024", "janvier 2024", "2024-13-01", "not-a-date"])(
    "rejette une date_debut mal formée : %s",
    (dateInvalide) => {
      const result = getHistoriqueIndicateurInputSchema.safeParse({
        indicateur_id: "IND-001",
        territoire_code: "DEPT-75",
        date_debut: dateInvalide,
      });

      expect(result.success).toBe(false);
    },
  );

  it("accepte une date_debut au format ISO", () => {
    const result = getHistoriqueIndicateurInputSchema.safeParse({
      indicateur_id: "IND-001",
      territoire_code: "DEPT-75",
      date_debut: "2024-01-01",
    });

    expect(result.success).toBe(true);
  });
});

describe("createGetHistoriqueIndicateurTool execute", () => {
  it("retourne introuvable quand l'indicateur n'existe pas", async () => {
    // Given
    const getIndicateurContexteQuery = mock<GetIndicateurContexteQuery>({
      execute: async () => null,
    });
    const getEvolutionIndicateurTerritoireQuery =
      mock<GetEvolutionIndicateurTerritoireQuery>();
    const getHistoriqueIndicateurTerritoireQuery =
      mock<GetHistoriqueIndicateurTerritoireQuery>();
    const tool = createGetHistoriqueIndicateurTool({
      getIndicateurContexteQuery,
      getHistoriqueIndicateurTerritoireQuery,
      getEvolutionIndicateurTerritoireQuery,
    })({
      territoiresAccessibles: ["NAT-FR", "REG-11", "DEPT-75"],
      chantiersAccessibles: ["CH-001"],
    });

    // When
    const result = await executeTool(tool, {
      indicateur_id: "IND-INEXISTANT",
      territoire_code: "DEPT-75",
    });

    // Then
    expect(result).toEqual({
      indicateur: null,
      introuvable: true,
      _output_instructions: expect.any(String),
    });
  });

  it.each([
    ["NAT-FR", "NAT", { mailleNatAgregee: true, mailleRegAgregee: false }],
    ["REG-11", "REG", { mailleNatAgregee: false, mailleRegAgregee: true }],
  ])(
    "bloque l'historique et n'appelle pas la query quand l'indicateur est agrégé à la maille %s",
    async (territoireCode, _maille, drapeaux) => {
      // Given
      const getIndicateurContexteQuery = mock<GetIndicateurContexteQuery>({
        execute: async () => ({ ...contexteParDefaut, ...drapeaux }),
      });
      const getEvolutionIndicateurTerritoireQuery =
        mock<GetEvolutionIndicateurTerritoireQuery>();
      const getHistoriqueIndicateurTerritoireQuery =
        mock<GetHistoriqueIndicateurTerritoireQuery>();
      const tool = createGetHistoriqueIndicateurTool({
        getIndicateurContexteQuery,
        getHistoriqueIndicateurTerritoireQuery,
        getEvolutionIndicateurTerritoireQuery,
      })({
        territoiresAccessibles: ["NAT-FR", "REG-11", "DEPT-75"],
        chantiersAccessibles: ["CH-001"],
      });

      // When
      const result = await executeTool(tool, {
        indicateur_id: "IND-001",
        territoire_code: territoireCode,
      });

      // Then
      expect(result).toEqual({
        indicateur: {
          id: "IND-001",
          nom: "Indicateur test",
          unite_mesure: "%",
        },
        territoire_code: territoireCode,
        agrege_bloque: true,
        _output_instructions: expect.any(String),
      });
      expect(
        getHistoriqueIndicateurTerritoireQuery.execute,
      ).not.toHaveBeenCalled();
    },
  );

  it("demande une précision de période quand le volume dépasse le seuil, sans plage fournie", async () => {
    // Given
    const getIndicateurContexteQuery = mock<GetIndicateurContexteQuery>({
      execute: async () => contexteParDefaut,
    });
    const getEvolutionIndicateurTerritoireQuery =
      mock<GetEvolutionIndicateurTerritoireQuery>();
    const getHistoriqueIndicateurTerritoireQuery =
      mock<GetHistoriqueIndicateurTerritoireQuery>({
        execute: async () => ({
          nombreEvenements: 101,
          dateMin: "2020-01-01",
          dateMax: "2020-02-10",
          groupes: [],
        }),
      });
    const tool = createGetHistoriqueIndicateurTool({
      getIndicateurContexteQuery,
      getHistoriqueIndicateurTerritoireQuery,
      getEvolutionIndicateurTerritoireQuery,
    })({
      territoiresAccessibles: ["NAT-FR", "REG-11", "DEPT-75"],
      chantiersAccessibles: ["CH-001"],
    });

    // When
    const result = await executeTool(tool, {
      indicateur_id: "IND-001",
      territoire_code: "DEPT-75",
    });

    // Then
    expect(result).toEqual({
      indicateur: { id: "IND-001", nom: "Indicateur test", unite_mesure: "%" },
      territoire_code: "DEPT-75",
      besoin_precision: {
        nombre_evenements: 101,
        date_evenement_la_plus_ancienne: "2020-01-01",
        date_evenement_la_plus_recente: "2020-02-10",
      },
      _output_instructions: expect.any(String),
    });
  });

  it("demande quand même une précision de période quand une plage est fournie mais dépasse encore le seuil", async () => {
    // Given
    const getIndicateurContexteQuery = mock<GetIndicateurContexteQuery>({
      execute: async () => contexteParDefaut,
    });
    const getEvolutionIndicateurTerritoireQuery =
      mock<GetEvolutionIndicateurTerritoireQuery>();
    const getHistoriqueIndicateurTerritoireQuery =
      mock<GetHistoriqueIndicateurTerritoireQuery>({
        execute: async () => ({
          nombreEvenements: 101,
          dateMin: "2024-01-01",
          dateMax: "2024-02-10",
          groupes: [],
        }),
      });
    const tool = createGetHistoriqueIndicateurTool({
      getIndicateurContexteQuery,
      getHistoriqueIndicateurTerritoireQuery,
      getEvolutionIndicateurTerritoireQuery,
    })({
      territoiresAccessibles: ["NAT-FR", "REG-11", "DEPT-75"],
      chantiersAccessibles: ["CH-001"],
    });

    // When
    const result = await executeTool(tool, {
      indicateur_id: "IND-001",
      territoire_code: "DEPT-75",
      date_debut: "2024-01-01",
      date_fin: "2024-12-31",
    });

    // Then
    expect(result).toEqual({
      indicateur: { id: "IND-001", nom: "Indicateur test", unite_mesure: "%" },
      territoire_code: "DEPT-75",
      besoin_precision: {
        nombre_evenements: 101,
        date_evenement_la_plus_ancienne: "2024-01-01",
        date_evenement_la_plus_recente: "2024-02-10",
      },
      _output_instructions: expect.any(String),
    });
  });

  it("retourne les groupes tels que fournis par la query quand le volume est sous le seuil", async () => {
    // Given
    const getIndicateurContexteQuery = mock<GetIndicateurContexteQuery>({
      execute: async () => contexteParDefaut,
    });
    const getEvolutionIndicateurTerritoireQuery =
      mock<GetEvolutionIndicateurTerritoireQuery>();
    const getHistoriqueIndicateurTerritoireQuery =
      mock<GetHistoriqueIndicateurTerritoireQuery>({
        execute: async () => ({
          nombreEvenements: 1,
          dateMin: "2024-01-01",
          dateMax: "2024-01-01",
          groupes: [
            {
              date_valeur: "01/2024",
              evenements: [
                {
                  ordre: 1,
                  date_creation: "15/01/2024 12:00",
                  description:
                    "Import direct par la direction de projet : première valeur d'avancement enregistrée pour cette date. Nouvelle valeur importée dans PILOTE : 10.",
                  categorie: "IMPORT",
                },
              ],
            },
          ],
        }),
      });
    const tool = createGetHistoriqueIndicateurTool({
      getIndicateurContexteQuery,
      getHistoriqueIndicateurTerritoireQuery,
      getEvolutionIndicateurTerritoireQuery,
    })({
      territoiresAccessibles: ["NAT-FR", "REG-11", "DEPT-75"],
      chantiersAccessibles: ["CH-001"],
    });

    // When
    const result = await executeTool(tool, {
      indicateur_id: "IND-001",
      territoire_code: "DEPT-75",
      date_debut: "2024-01-01",
      date_fin: "2024-12-31",
    });

    // Then
    expect(result).toEqual({
      indicateur: { id: "IND-001", nom: "Indicateur test", unite_mesure: "%" },
      territoire_code: "DEPT-75",
      groupes: [
        {
          date_valeur: "01/2024",
          evenements: [
            {
              ordre: 1,
              date_creation: "15/01/2024 12:00",
              description:
                "Import direct par la direction de projet : première valeur d'avancement enregistrée pour cette date. Nouvelle valeur importée dans PILOTE : 10.",
              categorie: "IMPORT",
            },
          ],
        },
      ],
      _output_instructions: expect.any(String),
    });
    expect(
      getEvolutionIndicateurTerritoireQuery.execute,
    ).not.toHaveBeenCalled();
  });

  it("ajoute la construction et la valeur affichée par mois quand la valeur affichée diffère de la valeur importée", async () => {
    // Given
    const explicationValeurAffichee =
      "Les valeurs sont importées mois par mois. La valeur affichée dans PILOTE est la somme des valeurs mensuelles depuis janvier de l'année.";
    const getIndicateurContexteQuery = mock<GetIndicateurContexteQuery>({
      execute: async () => ({
        ...contexteParDefaut,
        explicationValeurAffichee,
      }),
    });
    const evenementImport = {
      ordre: 1,
      date_creation: "15/02/2024 12:00",
      description:
        "Import direct par la direction de projet : première valeur d'avancement enregistrée pour cette date. Nouvelle valeur importée dans PILOTE : 50.",
      categorie: "IMPORT" as const,
    };
    const getHistoriqueIndicateurTerritoireQuery =
      mock<GetHistoriqueIndicateurTerritoireQuery>({
        execute: async () => ({
          nombreEvenements: 2,
          dateMin: "2024-02-01",
          dateMax: "2024-03-01",
          groupes: [
            { date_valeur: "02/2024", evenements: [evenementImport] },
            { date_valeur: "03/2024", evenements: [evenementImport] },
          ],
        }),
      });
    // Aucun point d'évolution pour 03/2024
    const getEvolutionIndicateurTerritoireQuery =
      mock<GetEvolutionIndicateurTerritoireQuery>({
        execute: vi.fn(async () => [
          { date: "01/2024", valeur: 552, taux_avancement_jalon: null },
          { date: "02/2024", valeur: 602, taux_avancement_jalon: null },
        ]),
      });
    const tool = createGetHistoriqueIndicateurTool({
      getIndicateurContexteQuery,
      getHistoriqueIndicateurTerritoireQuery,
      getEvolutionIndicateurTerritoireQuery,
    })({
      territoiresAccessibles: ["DEPT-75"],
      chantiersAccessibles: ["CH-001"],
    });

    // When
    const result = await executeTool(tool, {
      indicateur_id: "IND-001",
      territoire_code: "DEPT-75",
    });

    // Then
    expect(result).toEqual({
      indicateur: { id: "IND-001", nom: "Indicateur test", unite_mesure: "%" },
      territoire_code: "DEPT-75",
      construction_valeur_affichee: explicationValeurAffichee,
      groupes: [
        {
          date_valeur: "02/2024",
          valeur_affichee: 602,
          evenements: [evenementImport],
        },
        {
          date_valeur: "03/2024",
          valeur_affichee: null,
          evenements: [evenementImport],
        },
      ],
      _output_instructions: expect.stringContaining(
        "construction_valeur_affichee",
      ),
    });
    expect(getEvolutionIndicateurTerritoireQuery.execute).toHaveBeenCalledWith({
      indicateurId: "IND-001",
      territoireCode: "DEPT-75",
    });
  });

  it("passe les 9 types PROPOSITION_VALEUR_* à la query quand type_filtre vaut PROPOSITIONS", async () => {
    // Given
    const getIndicateurContexteQuery = mock<GetIndicateurContexteQuery>({
      execute: async () => contexteParDefaut,
    });
    const getEvolutionIndicateurTerritoireQuery =
      mock<GetEvolutionIndicateurTerritoireQuery>();
    const getHistoriqueIndicateurTerritoireQuery =
      mock<GetHistoriqueIndicateurTerritoireQuery>({
        execute: vi.fn(async () => ({
          nombreEvenements: 0,
          dateMin: null,
          dateMax: null,
          groupes: [],
        })),
      });
    const tool = createGetHistoriqueIndicateurTool({
      getIndicateurContexteQuery,
      getHistoriqueIndicateurTerritoireQuery,
      getEvolutionIndicateurTerritoireQuery,
    })({
      territoiresAccessibles: ["NAT-FR", "REG-11", "DEPT-75"],
      chantiersAccessibles: ["CH-001"],
    });

    // When
    await executeTool(tool, {
      indicateur_id: "IND-001",
      territoire_code: "DEPT-75",
      type_filtre: "PROPOSITIONS",
    });

    // Then
    expect(getHistoriqueIndicateurTerritoireQuery.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        typesEvenement: [
          "PROPOSITION_VALEUR_CREEE",
          "PROPOSITION_VALEUR_MODIFIEE",
          "PROPOSITION_VALEUR_SUPPRIMEE",
          "PROPOSITION_VALEUR_REFUSEE",
          "PROPOSITION_VALEUR_ACCUSEE_RECEPTION",
          "PROPOSITION_VALEUR_ACCEPTEE",
          "PROPOSITION_VALEUR_IGNOREE_VALEUR_MODIFIEE",
          "PROPOSITION_VALEUR_IGNOREE_VALEUR_HISTORISEE",
          "PROPOSITION_VALEUR_ACCEPTEE_AVEC_MODIFICATION",
        ],
      }),
    );
  });

  it("rejette un territoire non accessible sans appeler la query de contexte", async () => {
    // Given
    const getIndicateurContexteQuery = mock<GetIndicateurContexteQuery>();
    const getEvolutionIndicateurTerritoireQuery =
      mock<GetEvolutionIndicateurTerritoireQuery>();
    const getHistoriqueIndicateurTerritoireQuery =
      mock<GetHistoriqueIndicateurTerritoireQuery>();
    const tool = createGetHistoriqueIndicateurTool({
      getIndicateurContexteQuery,
      getHistoriqueIndicateurTerritoireQuery,
      getEvolutionIndicateurTerritoireQuery,
    })({
      territoiresAccessibles: ["NAT-FR", "REG-11", "DEPT-75"],
      chantiersAccessibles: ["CH-001"],
    });

    // When / Then
    await expect(
      executeTool(tool, {
        indicateur_id: "IND-001",
        territoire_code: "DEPT-INACCESSIBLE",
      }),
    ).rejects.toThrow("Accès non autorisé au territoire DEPT-INACCESSIBLE");
    expect(getIndicateurContexteQuery.execute).not.toHaveBeenCalled();
  });

  it("rejette un chantier non accessible", async () => {
    // Given
    const getIndicateurContexteQuery = mock<GetIndicateurContexteQuery>({
      execute: async () => ({
        ...contexteParDefaut,
        chantier: { id: "CH-INACCESSIBLE", nom: "Chantier test" },
      }),
    });
    const getEvolutionIndicateurTerritoireQuery =
      mock<GetEvolutionIndicateurTerritoireQuery>();
    const getHistoriqueIndicateurTerritoireQuery =
      mock<GetHistoriqueIndicateurTerritoireQuery>();
    const tool = createGetHistoriqueIndicateurTool({
      getIndicateurContexteQuery,
      getHistoriqueIndicateurTerritoireQuery,
      getEvolutionIndicateurTerritoireQuery,
    })({
      territoiresAccessibles: ["NAT-FR", "REG-11", "DEPT-75"],
      chantiersAccessibles: ["CH-001"],
    });

    // When / Then
    await expect(
      executeTool(tool, {
        indicateur_id: "IND-001",
        territoire_code: "DEPT-75",
      }),
    ).rejects.toThrow("Accès non autorisé au chantier CH-INACCESSIBLE");
    expect(
      getHistoriqueIndicateurTerritoireQuery.execute,
    ).not.toHaveBeenCalled();
  });
});
