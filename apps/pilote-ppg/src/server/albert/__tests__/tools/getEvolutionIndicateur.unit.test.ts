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
          { date: "01/2024", valeur: 10, taux_avancement_jalon: null },
          { date: "06/2024", valeur: 20, taux_avancement_jalon: 45 },
        ],
      });
    const tool = createGetEvolutionIndicateurTool({
      getIndicateurContexteQuery,
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
      indicateur: {
        id: "IND-001",
        nom: "Indicateur test",
        unite_mesure: "%",
        chantier_id: "CH-001",
      },
      territoire_code: "DEPT-75",
      points: [
        { date: "01/2024", valeur: 10, taux_avancement_jalon: null },
        { date: "06/2024", valeur: 20, taux_avancement_jalon: 45 },
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
    })({
      territoiresAccessibles: ["DEPT-75"],
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
    expect(
      getEvolutionIndicateurTerritoireQuery.execute,
    ).not.toHaveBeenCalled();
  });

  it("rejette un territoire non accessible sans appeler la query de contexte", async () => {
    // Given
    const getIndicateurContexteQuery = mock<GetIndicateurContexteQuery>();
    const getEvolutionIndicateurTerritoireQuery =
      mock<GetEvolutionIndicateurTerritoireQuery>();
    const tool = createGetEvolutionIndicateurTool({
      getIndicateurContexteQuery,
      getEvolutionIndicateurTerritoireQuery,
    })({
      territoiresAccessibles: ["DEPT-75"],
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
        id: "IND-001",
        nom: "Indicateur test",
        description: null,
        uniteMesure: "%",
        chantier: { id: "CH-INACCESSIBLE", nom: "Chantier test" },
        mailleNatAgregee: false,
        mailleRegAgregee: false,
      }),
    });
    const getEvolutionIndicateurTerritoireQuery =
      mock<GetEvolutionIndicateurTerritoireQuery>();
    const tool = createGetEvolutionIndicateurTool({
      getIndicateurContexteQuery,
      getEvolutionIndicateurTerritoireQuery,
    })({
      territoiresAccessibles: ["DEPT-75"],
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
      getEvolutionIndicateurTerritoireQuery.execute,
    ).not.toHaveBeenCalled();
  });
});
