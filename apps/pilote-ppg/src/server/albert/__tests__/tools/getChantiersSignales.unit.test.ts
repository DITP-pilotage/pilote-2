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
      jalon: 2025,
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
      jalon: 2025,
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

  test("masque la catégorie tendance_baisse pour un territoire hors périmètre accessible", async () => {
    // Given — REG-99 résolu via sous-territoires mais absent de territoiresAccessibles
    const resultatMulti: Awaited<
      ReturnType<GetChantiersSignalesListQuery["execute"]>
    > = {
      territoire_code: "REG-99",
      territoire_nom: "Région test",
      jalon: 2025,
      maille: "REG",
      chantiers: [
        {
          chantier: {
            id: "CH-001",
            nom: "Chantier",
            axe: "Axe 1",
            ppg: "PPG 1",
            ministeres: ["MIN-01"],
          },
          categories_signalement: [
            "Chantier(s) avec météo et synthèse des résultats non renseignés",
            "Chantier(s) avec tendance en baisse",
          ],
          meteo: "NON_RENSEIGNEE",
          tendance: "BAISSE",
          ecart: 0,
          taux_avancement: 50,
        },
      ],
    };
    const tool = buildTool({
      queryResults: { "REG-99": resultatMulti },
      territoiresAccessibles: ["REG-11"],
      resoudre: ["REG-99"],
    });

    // When
    const result = await executeTool(tool, {
      territoire_code: "REG-99",
      jalon: 2025,
    });

    // Then — tendance_baisse retirée, meteo_synthese conservée
    expect(result.resultats).toEqual([
      expect.objectContaining({
        chantiers: [
          expect.objectContaining({
            tendance: null,
            categories_signalement: [
              "Chantier(s) avec météo et synthèse des résultats non renseignés",
            ],
          }),
        ],
      }),
    ]);
  });

  test("retire entièrement un chantier dont la seule catégorie devient masquée", async () => {
    // Given — chantier avec pour unique catégorie tendance_baisse, sur un territoire hors périmètre accessible
    const resultatUniqueCategorie: Awaited<
      ReturnType<GetChantiersSignalesListQuery["execute"]>
    > = {
      territoire_code: "REG-99",
      territoire_nom: "Région test",
      jalon: 2025,
      maille: "REG",
      chantiers: [
        {
          chantier: {
            id: "CH-001",
            nom: "Chantier",
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
    const tool = buildTool({
      queryResults: { "REG-99": resultatUniqueCategorie },
      territoiresAccessibles: ["REG-11"],
      resoudre: ["REG-99"],
    });

    // When
    const result = await executeTool(tool, {
      territoire_code: "REG-99",
      jalon: 2025,
    });

    // Then — le chantier disparaît entièrement, il ne lui reste aucune catégorie
    expect(result.resultats).toEqual([
      expect.objectContaining({
        chantiers: [],
      }),
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
      jalon: 2025,
      chantier_ids: ["CH-001"],
    });

    // Then
    expect(result.resultats).toEqual([]);
    expect(result._output_instructions).toContain(
      "Aucun des chantiers demandés",
    );
  });
});
