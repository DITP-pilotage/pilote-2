import { mock } from "vitest-mock-extended";
import {
  createGetEvolutionIndicateurTool,
  type GetEvolutionIndicateurOutput,
} from "@/server/albert/tools/getEvolutionIndicateur";
import type { GetIndicateurContexteQuery } from "@/server/chantiers/query/GetIndicateurContexteQuery";
import type { GetEvolutionIndicateurTerritoireQuery } from "@/server/chantiers/query/GetEvolutionIndicateurTerritoireQuery";

const executeTool = async (
  tool: ReturnType<ReturnType<typeof createGetEvolutionIndicateurTool>>,
  input: { indicateur_id: string; territoire_code: string },
): Promise<GetEvolutionIndicateurOutput> =>
  tool.execute!(input, {
    toolCallId: "test",
    messages: [],
    abortSignal: undefined,
    context: {},
  }) as Promise<GetEvolutionIndicateurOutput>;

describe("createGetEvolutionIndicateurTool execute", () => {
  it("retourne les points d'évolution avec le contexte de l'indicateur", async () => {
    // Given
    const getIndicateurContexteQuery = mock<GetIndicateurContexteQuery>({
      execute: async () => ({
        id: "IND-001",
        nom: "Indicateur test",
        description: null,
        uniteMesure: "%",
        chantier: { id: "CH-001", nom: "Chantier test" },
        mailleNatAgregee: false,
        mailleRegAgregee: false,
      }),
    });
    const getEvolutionIndicateurTerritoireQuery =
      mock<GetEvolutionIndicateurTerritoireQuery>({
        execute: async () => [
          { date: "2024-01-01", valeur: 10 },
          { date: "2024-06-01", valeur: 20 },
        ],
      });
    const tool = createGetEvolutionIndicateurTool({
      getIndicateurContexteQuery,
      getEvolutionIndicateurTerritoireQuery,
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
      points: [
        { date: "01/2024", valeur: 10 },
        { date: "06/2024", valeur: 20 },
      ],
      _output_instructions: expect.any(String),
    });
  });

  it("retourne introuvable quand l'indicateur n'existe pas, sans appeler la query d'évolution", async () => {
    // Given
    const getIndicateurContexteQuery = mock<GetIndicateurContexteQuery>({
      execute: async () => null,
    });
    const getEvolutionIndicateurTerritoireQuery =
      mock<GetEvolutionIndicateurTerritoireQuery>();
    const tool = createGetEvolutionIndicateurTool({
      getIndicateurContexteQuery,
      getEvolutionIndicateurTerritoireQuery,
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
    expect(getEvolutionIndicateurTerritoireQuery.execute).not.toHaveBeenCalled();
  });
});
