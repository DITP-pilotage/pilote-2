import { mock } from "vitest-mock-extended";
import {
  createGetHistoriqueIndicateurTool,
  getHistoriqueIndicateurInputSchema,
  type GetHistoriqueIndicateurOutput,
} from "@/server/albert/tools/getHistoriqueIndicateur";
import type { GetIndicateurContexteQuery } from "@/server/chantiers/query/GetIndicateurContexteQuery";
import type { GetHistoriqueIndicateurTerritoireQuery } from "@/server/chantiers/query/GetHistoriqueIndicateurTerritoireQuery";

const contexteParDefaut = {
  id: "IND-001",
  nom: "Indicateur test",
  description: null,
  uniteMesure: "%",
  chantier: { id: "CH-001", nom: "Chantier test" },
  mailleNatAgregee: false,
  mailleRegAgregee: false,
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
    const getHistoriqueIndicateurTerritoireQuery =
      mock<GetHistoriqueIndicateurTerritoireQuery>();
    const tool = createGetHistoriqueIndicateurTool({
      getIndicateurContexteQuery,
      getHistoriqueIndicateurTerritoireQuery,
    })();

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
      const getHistoriqueIndicateurTerritoireQuery =
        mock<GetHistoriqueIndicateurTerritoireQuery>();
      const tool = createGetHistoriqueIndicateurTool({
        getIndicateurContexteQuery,
        getHistoriqueIndicateurTerritoireQuery,
      })();

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
    const getHistoriqueIndicateurTerritoireQuery =
      mock<GetHistoriqueIndicateurTerritoireQuery>({
        execute: async () => ({
          nombreEvenements: 41,
          dateMin: "2020-01-01",
          dateMax: "2020-02-10",
          groupes: [],
        }),
      });
    const tool = createGetHistoriqueIndicateurTool({
      getIndicateurContexteQuery,
      getHistoriqueIndicateurTerritoireQuery,
    })();

    // When
    const result = await executeTool(tool, {
      indicateur_id: "IND-001",
      territoire_code: "DEPT-75",
    });

    // Then
    expect(result).toEqual({
      indicateur: { id: "IND-001", nom: "Indicateur test", unite_mesure: "%" },
      territoire_code: "DEPT-75",
      besoin_precision: true,
      nombre_evenements: 41,
      date_evenement_la_plus_ancienne: "2020-01-01",
      date_evenement_la_plus_recente: "2020-02-10",
      _output_instructions: expect.any(String),
    });
  });

  it("demande quand même une précision de période quand une plage est fournie mais dépasse encore le seuil", async () => {
    // Given
    const getIndicateurContexteQuery = mock<GetIndicateurContexteQuery>({
      execute: async () => contexteParDefaut,
    });
    const getHistoriqueIndicateurTerritoireQuery =
      mock<GetHistoriqueIndicateurTerritoireQuery>({
        execute: async () => ({
          nombreEvenements: 41,
          dateMin: "2024-01-01",
          dateMax: "2024-02-10",
          groupes: [],
        }),
      });
    const tool = createGetHistoriqueIndicateurTool({
      getIndicateurContexteQuery,
      getHistoriqueIndicateurTerritoireQuery,
    })();

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
      besoin_precision: true,
      nombre_evenements: 41,
      date_evenement_la_plus_ancienne: "2024-01-01",
      date_evenement_la_plus_recente: "2024-02-10",
      _output_instructions: expect.any(String),
    });
  });

  it("retourne les groupes tels que fournis par la query quand le volume est sous le seuil", async () => {
    // Given
    const getIndicateurContexteQuery = mock<GetIndicateurContexteQuery>({
      execute: async () => contexteParDefaut,
    });
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
                  libelle: "→ nouvelle valeur affichée dans PILOTE : 10",
                  type_valeur: "VALEUR_AVANCEMENT",
                },
              ],
            },
          ],
        }),
      });
    const tool = createGetHistoriqueIndicateurTool({
      getIndicateurContexteQuery,
      getHistoriqueIndicateurTerritoireQuery,
    })();

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
              libelle: "→ nouvelle valeur affichée dans PILOTE : 10",
              type_valeur: "VALEUR_AVANCEMENT",
            },
          ],
        },
      ],
      _output_instructions: expect.any(String),
    });
  });

  it("passe les 9 types PROPOSITION_VALEUR_* à la query quand type_filtre vaut PROPOSITIONS", async () => {
    // Given
    const getIndicateurContexteQuery = mock<GetIndicateurContexteQuery>({
      execute: async () => contexteParDefaut,
    });
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
    })();

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
});
