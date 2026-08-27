import { describe, expect, test } from "vitest";
import { mock } from "vitest-mock-extended";
import {
  createGetChantiersSignalesTool,
  type GetChantiersSignalesOutput,
} from "@/server/albert/tools/getChantiersSignales";
import type { GetChantiersSignalesListQuery } from "@/server/chantiers/query/GetChantiersSignalesListQuery";
import type { TerritoireResolver } from "@/server/albert/domain/TerritoireResolver";

const buildTool = ({
  queryResults,
  territoiresAccessibles = ["DEPT-75", "REG-11", "NAT-FR"],
  chantiersAccessibles = ["CH-001", "CH-002"],
  resoudre,
}: {
  queryResults: Record<
    string,
    Awaited<ReturnType<GetChantiersSignalesListQuery["execute"]>>
  >;
  territoiresAccessibles?: string[];
  chantiersAccessibles?: string[];
  resoudre?: string[];
}) => {
  const query = mock<GetChantiersSignalesListQuery>({
    execute: async (params) => queryResults[params.territoireCode],
  });
  const territoireResolver = mock<TerritoireResolver>({
    resoudre: async () => resoudre ?? Object.keys(queryResults),
  });
  return createGetChantiersSignalesTool({
    getChantiersSignalesListQuery: query,
    territoireResolver,
  })({ territoiresAccessibles, chantiersAccessibles });
};

const buildToolCapturing = ({
  territoiresAccessibles = ["DEPT-75", "REG-11", "NAT-FR"],
  chantiersAccessibles = ["CH-001", "CH-002"],
  resoudre,
  resultatParDefaut,
}: {
  territoiresAccessibles?: string[];
  chantiersAccessibles?: string[];
  resoudre?: string[];
  resultatParDefaut?: Awaited<
    ReturnType<GetChantiersSignalesListQuery["execute"]>
  >;
} = {}) => {
  const capturedParams: Parameters<
    GetChantiersSignalesListQuery["execute"]
  >[0][] = [];
  const query = mock<GetChantiersSignalesListQuery>({
    execute: async (params) => {
      capturedParams.push(params);
      return {
        ...(resultatParDefaut ?? resultatDept),
        territoire_code: params.territoireCode,
      };
    },
  });
  const territoireResolver = mock<TerritoireResolver>({
    resoudre: async () => resoudre ?? ["DEPT-75"],
  });
  const tool = createGetChantiersSignalesTool({
    getChantiersSignalesListQuery: query,
    territoireResolver,
  })({ territoiresAccessibles, chantiersAccessibles });
  return { tool, capturedParams };
};

const executeTool = async (
  tool: ReturnType<ReturnType<typeof createGetChantiersSignalesTool>>,
  input: Record<string, unknown>,
): Promise<GetChantiersSignalesOutput> =>
  tool.execute!(input as Parameters<NonNullable<typeof tool.execute>>[0], {
    toolCallId: "test",
    messages: [],
    abortSignal: undefined,
  }) as Promise<GetChantiersSignalesOutput>;

const resultatDept: Awaited<
  ReturnType<GetChantiersSignalesListQuery["execute"]>
> = {
  territoire_code: "DEPT-75",
  territoire_nom: "Paris",
  jalon: 2025,
  maille: "DEPT",
  chantiers: [
    {
      chantier: {
        id: "CH-001",
        nom: "Chantier test",
        axe: "Axe 1",
        ppg: "PPG 1",
        ministeres: ["MIN-01"],
      },
      categories_signalement: ["Chantier(s) avec tendance en baisse"],
      meteo: "SOLEIL",
      tendance: "BAISSE",
      ecart: 0,
      taux_avancement: 50,
    },
  ],
};

describe("createGetChantiersSignalesTool execute", () => {
  test("retourne les chantiers signalés du territoire demandé", async () => {
    // Given
    const tool = buildTool({
      queryResults: { "DEPT-75": resultatDept },
      resoudre: ["DEPT-75"],
    });

    // When
    const result = await executeTool(tool, {
      territoire_code: "DEPT-75",
    });

    // Then
    expect(result.resultats).toEqual([resultatDept]);
  });

  test("renvoie non_applicable quand la catégorie demandée ne s'applique pas à la maille", async () => {
    // Given — retard_mediane demandé sur un territoire national
    const tool = buildTool({
      queryResults: {},
      resoudre: ["NAT-FR"],
    });

    // When
    const result = await executeTool(tool, {
      territoire_code: "NAT-FR",
      categorie_signalement: "retard_mediane",
    });

    // Then
    expect(result.resultats).toEqual([
      {
        territoire_code: "NAT-FR",
        chantiers: [],
        non_applicable: { raison: expect.any(String) },
      },
    ]);
  });

  test("rejette l'accès à un territoire non accessible", async () => {
    // Given
    const tool = buildTool({
      queryResults: {},
      territoiresAccessibles: ["REG-11"],
      resoudre: [],
    });

    // When / Then
    await expect(
      executeTool(tool, { territoire_code: "REG-99" }),
    ).rejects.toThrow("Accès non autorisé au territoire REG-99");
  });

  test("filtre silencieusement les sous-territoires non accessibles résolus via include_sous_territoires", async () => {
    // Given — REG-11 accessible, mais DEPT-99 (résolu comme sous-territoire) ne l'est pas
    const { tool, capturedParams } = buildToolCapturing({
      territoiresAccessibles: ["REG-11"],
      resoudre: ["REG-11", "DEPT-99"],
    });

    // When
    const result = await executeTool(tool, {
      territoire_code: "REG-11",
      include_sous_territoires: true,
    });

    // Then — seul REG-11 est interrogé, DEPT-99 est exclu sans erreur
    expect(capturedParams.map((params) => params.territoireCode)).toEqual([
      "REG-11",
    ]);
    expect(result.resultats).toEqual([
      expect.objectContaining({ territoire_code: "REG-11" }),
    ]);
  });

  test("retourne un message dédié quand aucun des chantiers demandés n'est accessible", async () => {
    // Given
    const tool = buildTool({
      queryResults: {},
      chantiersAccessibles: ["CH-999"],
      resoudre: ["DEPT-75"],
    });

    // When
    const result = await executeTool(tool, {
      territoire_code: "DEPT-75",
      chantier_ids: ["CH-001"],
    });

    // Then
    expect(result.resultats).toEqual([]);
    expect(result._output_instructions).toContain(
      "Aucun des chantiers demandés",
    );
  });

  test("filtre sur chantiersAccessibles par défaut quand chantier_ids n'est pas fourni", async () => {
    // Given
    const { tool, capturedParams } = buildToolCapturing({
      chantiersAccessibles: ["CH-001"],
      resoudre: ["DEPT-75"],
    });

    // When
    await executeTool(tool, {
      territoire_code: "DEPT-75",
    });

    // Then — pas de bypass de l'habilitation chantier : la liste accessible sert de filtre implicite
    expect(capturedParams).toEqual([
      expect.objectContaining({ chantierIds: ["CH-001"] }),
    ]);
  });

  test("transmet categorie_signalement à la query sous categorieSignalement", async () => {
    // Given
    const { tool, capturedParams } = buildToolCapturing({
      resoudre: ["DEPT-75"],
    });

    // When
    await executeTool(tool, {
      territoire_code: "DEPT-75",
      categorie_signalement: "retard_mediane",
    });

    // Then
    expect(capturedParams).toEqual([
      expect.objectContaining({ categorieSignalement: "retard_mediane" }),
    ]);
  });

  test("appelle la query une fois par territoire résolu via include_sous_territoires", async () => {
    // Given
    const { tool, capturedParams } = buildToolCapturing({
      territoiresAccessibles: ["REG-11", "DEPT-75"],
      resoudre: ["REG-11", "DEPT-75"],
    });

    // When
    const result = await executeTool(tool, {
      territoire_code: "REG-11",
      include_sous_territoires: true,
    });

    // Then — un appel par code résolu, un résultat par code
    expect(capturedParams.map((params) => params.territoireCode)).toEqual([
      "REG-11",
      "DEPT-75",
    ]);
    expect(result.resultats).toEqual([
      expect.objectContaining({ territoire_code: "REG-11" }),
      expect.objectContaining({ territoire_code: "DEPT-75" }),
    ]);
  });

  test("donne une consigne dédiée quand un résultat est non_applicable", async () => {
    // Given — retard_mediane demandé sur un territoire national
    const tool = buildTool({
      queryResults: {},
      resoudre: ["NAT-FR"],
    });

    // When
    const result = await executeTool(tool, {
      territoire_code: "NAT-FR",
      categorie_signalement: "retard_mediane",
    });

    // Then
    expect(result._output_instructions).toContain("non_applicable.raison");
  });
});
