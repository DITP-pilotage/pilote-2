import { describe, expect, test, vi } from "vitest";
import { mock } from "vitest-mock-extended";
import {
  createGetChantierCommentairesTool,
  type GetChantierCommentairesOutput,
  type TypeContenuChantier,
} from "@/server/albert/tools/getChantierCommentaires";
import type { GetChantierCommentairesQuery } from "@/server/chantiers/query/GetChantierCommentairesQuery";
import type { TerritoireResolver } from "@/server/albert/domain/TerritoireResolver";

const TOUS_LES_TYPES = [
  "freins_a_lever",
  "actions_a_venir",
  "actions_a_valoriser",
  "autres_resultats_obtenus_non_correles_aux_indicateurs",
  "decision_strategique",
  "commentaires_sur_les_donnees",
  "autres_resultats_obtenus",
  "synthese_des_resultats",
] satisfies TypeContenuChantier[];

const buildTool = ({
  territoiresAccessibles,
  sousTerritoires = {},
}: {
  territoiresAccessibles: string[];
  sousTerritoires?: Record<string, string[]>;
}) => {
  const executeQuery = vi.fn(async () => ({
    resultats: [],
    types_non_accessibles: [],
  }));
  const query = mock<GetChantierCommentairesQuery>({
    execute: executeQuery,
  });
  const territoireResolver = mock<TerritoireResolver>({
    resoudre: async (
      territoireCode: string,
      includeSousTerritoires: boolean,
    ) =>
      includeSousTerritoires
        ? [territoireCode, ...(sousTerritoires[territoireCode] ?? [])]
        : [territoireCode],
  });
  const tool = createGetChantierCommentairesTool({
    getChantierCommentairesQuery: query,
    territoireResolver,
  })({ territoiresAccessibles });
  return { tool, executeQuery };
};

const executeTool = async (
  tool: ReturnType<ReturnType<typeof createGetChantierCommentairesTool>>,
  input: {
    chantier_id: string;
    territoire_code: string;
    include_sous_territoires: boolean;
    types?: TypeContenuChantier[];
  },
): Promise<GetChantierCommentairesOutput> =>
  tool.execute!(input, {
    toolCallId: "test",
    messages: [],
    abortSignal: undefined,
    context: {},
  }) as Promise<GetChantierCommentairesOutput>;

describe("createGetChantierCommentairesTool execute", () => {
  test("lève une erreur si le territoire n'est pas accessible", async () => {
    // Given
    const { tool } = buildTool({ territoiresAccessibles: ["DEPT-75"] });

    // When / Then
    await expect(
      executeTool(tool, {
        chantier_id: "CH-001",
        territoire_code: "REG-11",
        include_sous_territoires: false,
      }),
    ).rejects.toThrow("Accès non autorisé au territoire REG-11");
  });

  test("appelle la query avec le territoire demandé et tous les types par défaut", async () => {
    // Given
    const { tool, executeQuery } = buildTool({
      territoiresAccessibles: ["DEPT-75", "NAT-FR"],
    });

    // When
    const result = await executeTool(tool, {
      chantier_id: "CH-001",
      territoire_code: "DEPT-75",
      include_sous_territoires: false,
    });

    // Then
    expect(executeQuery).toHaveBeenCalledWith({
      chantierId: "CH-001",
      territoireCodes: ["DEPT-75"],
      types: TOUS_LES_TYPES,
      inclureCommentairesNationaux: true,
    });
    expect(result.resultats).toEqual([]);
    expect(result.types_non_accessibles).toEqual([]);
    expect(result._output_instructions).toContain(
      "Rédigé pour <territoire_nom>",
    );
  });

  test("filtre les sous-territoires inaccessibles avant d'appeler la query", async () => {
    // Given
    const { tool, executeQuery } = buildTool({
      territoiresAccessibles: ["REG-11", "DEPT-75"],
      sousTerritoires: { "REG-11": ["DEPT-75", "DEPT-77"] },
    });

    // When
    await executeTool(tool, {
      chantier_id: "CH-001",
      territoire_code: "REG-11",
      include_sous_territoires: true,
    });

    // Then
    expect(executeQuery).toHaveBeenCalledWith({
      chantierId: "CH-001",
      territoireCodes: ["REG-11", "DEPT-75"],
      types: TOUS_LES_TYPES,
      inclureCommentairesNationaux: false,
    });
  });

  test("transmet les types explicitement demandés à la query", async () => {
    // Given
    const { tool, executeQuery } = buildTool({
      territoiresAccessibles: ["DEPT-75"],
    });

    // When
    await executeTool(tool, {
      chantier_id: "CH-001",
      territoire_code: "DEPT-75",
      include_sous_territoires: false,
      types: ["commentaires_sur_les_donnees"],
    });

    // Then
    expect(executeQuery).toHaveBeenCalledWith({
      chantierId: "CH-001",
      territoireCodes: ["DEPT-75"],
      types: ["commentaires_sur_les_donnees"],
      inclureCommentairesNationaux: false,
    });
  });
});
