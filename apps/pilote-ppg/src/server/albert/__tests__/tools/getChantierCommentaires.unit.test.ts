import { describe, expect, test, vi } from "vitest";
import { mock } from "vitest-mock-extended";
import {
  createGetChantierCommentairesTool,
  type GetChantierCommentairesOutput,
  type TypeContenuChantier,
} from "@/server/albert/tools/getChantierCommentaires";
import type {
  GetChantierCommentairesQuery,
  GetChantierCommentairesResult,
} from "@/server/chantiers/query/GetChantierCommentairesQuery";
import type { TerritoireResolver } from "@/server/albert/domain/TerritoireResolver";

const TYPES_NATIONAUX = [
  "freins_a_lever",
  "actions_a_venir",
  "actions_a_valoriser",
  "autres_resultats_obtenus_non_correles_aux_indicateurs",
  "decision_strategique",
];
const TYPES_TERRITORIAUX = [
  "commentaires_sur_les_donnees",
  "autres_resultats_obtenus",
];

const resultatVide = (
  territoireCode: string,
): GetChantierCommentairesResult => ({
  territoire_code: territoireCode,
  chantier_id: "CH-001",
  commentaires: [],
});

const buildTool = ({
  territoiresAccessibles,
  sousTerritoires = {},
}: {
  territoiresAccessibles: string[];
  sousTerritoires?: Record<string, string[]>;
}) => {
  const executeQuery = vi.fn(
    async (params: {
      chantierId: string;
      territoireCode: string;
      types: string[];
    }) => resultatVide(params.territoireCode),
  );
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

  test("get all sur un département remonte aussi les types nationaux quand NAT-FR est accessible", async () => {
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
    expect(executeQuery.mock.calls.map(([params]) => params)).toEqual([
      {
        chantierId: "CH-001",
        territoireCode: "DEPT-75",
        types: [...TYPES_TERRITORIAUX, "synthese_des_resultats"],
      },
      {
        chantierId: "CH-001",
        territoireCode: "NAT-FR",
        types: TYPES_NATIONAUX,
      },
    ]);
    expect(result.resultats).toEqual([
      resultatVide("DEPT-75"),
      resultatVide("NAT-FR"),
    ]);
    expect(result.types_non_accessibles).toEqual([]);
  });

  test("get all sur un département sans accès à NAT-FR signale les types nationaux non accessibles", async () => {
    // Given
    const { tool, executeQuery } = buildTool({
      territoiresAccessibles: ["DEPT-75"],
    });

    // When
    const result = await executeTool(tool, {
      chantier_id: "CH-001",
      territoire_code: "DEPT-75",
      include_sous_territoires: false,
    });

    // Then
    expect(executeQuery.mock.calls.map(([params]) => params)).toEqual([
      {
        chantierId: "CH-001",
        territoireCode: "DEPT-75",
        types: [...TYPES_TERRITORIAUX, "synthese_des_resultats"],
      },
    ]);
    expect(result.resultats).toEqual([resultatVide("DEPT-75")]);
    expect(result.types_non_accessibles).toEqual(TYPES_NATIONAUX);
  });

  test("un type national demandé depuis un département est recherché sur NAT-FR uniquement", async () => {
    // Given
    const { tool, executeQuery } = buildTool({
      territoiresAccessibles: ["DEPT-75", "NAT-FR"],
    });

    // When
    const result = await executeTool(tool, {
      chantier_id: "CH-001",
      territoire_code: "DEPT-75",
      include_sous_territoires: false,
      types: ["freins_a_lever"],
    });

    // Then — aucun appel sur DEPT-75 : freins_a_lever n'existe pas à cette maille
    expect(executeQuery.mock.calls.map(([params]) => params)).toEqual([
      {
        chantierId: "CH-001",
        territoireCode: "NAT-FR",
        types: ["freins_a_lever"],
      },
    ]);
    expect(result.resultats).toEqual([resultatVide("NAT-FR")]);
    expect(result.types_non_accessibles).toEqual([]);
  });

  test("un type national demandé sans accès à NAT-FR est signalé sans résultat", async () => {
    // Given
    const { tool, executeQuery } = buildTool({
      territoiresAccessibles: ["DEPT-75"],
    });

    // When
    const result = await executeTool(tool, {
      chantier_id: "CH-001",
      territoire_code: "DEPT-75",
      include_sous_territoires: false,
      types: ["freins_a_lever"],
    });

    // Then
    expect(executeQuery).not.toHaveBeenCalled();
    expect(result.resultats).toEqual([]);
    expect(result.types_non_accessibles).toEqual(["freins_a_lever"]);
  });

  test("un type territorial demandé ne déclenche ni remontée nationale ni signalement", async () => {
    // Given
    const { tool, executeQuery } = buildTool({
      territoiresAccessibles: ["DEPT-75"],
    });

    // When
    const result = await executeTool(tool, {
      chantier_id: "CH-001",
      territoire_code: "DEPT-75",
      include_sous_territoires: false,
      types: ["commentaires_sur_les_donnees"],
    });

    // Then
    expect(executeQuery.mock.calls.map(([params]) => params)).toEqual([
      {
        chantierId: "CH-001",
        territoireCode: "DEPT-75",
        types: ["commentaires_sur_les_donnees"],
      },
    ]);
    expect(result.types_non_accessibles).toEqual([]);
  });

  test("get all sur NAT-FR interroge une seule fois NAT-FR avec la synthèse incluse", async () => {
    // Given
    const { tool, executeQuery } = buildTool({
      territoiresAccessibles: ["NAT-FR"],
    });

    // When
    const result = await executeTool(tool, {
      chantier_id: "CH-001",
      territoire_code: "NAT-FR",
      include_sous_territoires: false,
    });

    // Then — pas de double appel NAT-FR, et la synthèse nationale fait partie du territoire demandé
    expect(executeQuery.mock.calls.map(([params]) => params)).toEqual([
      {
        chantierId: "CH-001",
        territoireCode: "NAT-FR",
        types: [...TYPES_NATIONAUX, "synthese_des_resultats"],
      },
    ]);
    expect(result.resultats).toEqual([resultatVide("NAT-FR")]);
    expect(result.types_non_accessibles).toEqual([]);
  });

  test("include_sous_territoires filtre les sous-territoires inaccessibles et remonte NAT-FR une seule fois", async () => {
    // Given — DEPT-77 n'est pas accessible
    const { tool, executeQuery } = buildTool({
      territoiresAccessibles: ["REG-11", "DEPT-75", "NAT-FR"],
      sousTerritoires: { "REG-11": ["DEPT-75", "DEPT-77"] },
    });

    // When
    const result = await executeTool(tool, {
      chantier_id: "CH-001",
      territoire_code: "REG-11",
      include_sous_territoires: true,
    });

    // Then
    expect(executeQuery.mock.calls.map(([params]) => params)).toEqual([
      {
        chantierId: "CH-001",
        territoireCode: "REG-11",
        types: [...TYPES_TERRITORIAUX, "synthese_des_resultats"],
      },
      {
        chantierId: "CH-001",
        territoireCode: "DEPT-75",
        types: [...TYPES_TERRITORIAUX, "synthese_des_resultats"],
      },
      {
        chantierId: "CH-001",
        territoireCode: "NAT-FR",
        types: TYPES_NATIONAUX,
      },
    ]);
    expect(result.resultats).toEqual([
      resultatVide("REG-11"),
      resultatVide("DEPT-75"),
      resultatVide("NAT-FR"),
    ]);
  });

  test("include_sous_territoires depuis NAT-FR ne duplique pas NAT-FR", async () => {
    // Given
    const { tool, executeQuery } = buildTool({
      territoiresAccessibles: ["NAT-FR", "REG-11"],
      sousTerritoires: { "NAT-FR": ["REG-11"] },
    });

    // When
    await executeTool(tool, {
      chantier_id: "CH-001",
      territoire_code: "NAT-FR",
      include_sous_territoires: true,
    });

    // Then
    expect(executeQuery.mock.calls.map(([params]) => params)).toEqual([
      {
        chantierId: "CH-001",
        territoireCode: "NAT-FR",
        types: [...TYPES_NATIONAUX, "synthese_des_resultats"],
      },
      {
        chantierId: "CH-001",
        territoireCode: "REG-11",
        types: [...TYPES_TERRITORIAUX, "synthese_des_resultats"],
      },
    ]);
  });
});
