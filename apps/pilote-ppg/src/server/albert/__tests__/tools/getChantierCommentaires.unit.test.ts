import { describe, expect, test, vi } from "vitest";
import { mock } from "vitest-mock-extended";
import {
  createGetChantierCommentairesTool,
  type GetChantierCommentairesOutput,
} from "@/server/albert/tools/getChantierCommentaires";
import type {
  GetChantierCommentairesQuery,
  GetChantierCommentairesQueryResult,
} from "@/server/chantiers/query/GetChantierCommentairesQuery";
import type { TerritoireResolver } from "@/server/albert/domain/TerritoireResolver";
import type { GetChantiersIdentiteQuery } from "@/server/chantiers/query/GetChantiersIdentiteQuery";

const queryResult: GetChantierCommentairesQueryResult = {
  resultats: [
    {
      territoire_code: "REG-75",
      territoire_nom: "Île-de-France",
      chantier_id: "CH-084",
      commentaires: [
        {
          id: "commentaire-1",
          date_publication: "2026-01-12",
          contenu: "<p>Deux postes vacants.<br>Recrutement engagé.</p>",
          type: "freins_a_lever",
        },
      ],
    },
  ],
  types_non_accessibles: [],
};

const buildTool = ({
  query,
  territoiresAccessibles,
  chantiersAccessibles,
}: {
  query: GetChantierCommentairesQuery;
  territoiresAccessibles: string[];
  chantiersAccessibles: string[];
}) => {
  const territoireResolver = mock<TerritoireResolver>({
    resoudre: async (territoireCode: string) => [territoireCode],
  });
  return createGetChantierCommentairesTool({
    getChantierCommentairesQuery: query,
    territoireResolver,
    getChantiersIdentiteQuery: mock<GetChantiersIdentiteQuery>({
      execute: async () => [
        {
          id: "CH-084",
          nom: "Accélérer la rénovation énergétique",
          axe: "Axe",
          ppg: "PPG",
          ministeres: [],
        },
      ],
    }),
  })({ territoiresAccessibles, chantiersAccessibles });
};

const executeTool = async (
  tool: ReturnType<ReturnType<typeof createGetChantierCommentairesTool>>,
  chantier_id: string,
): Promise<GetChantierCommentairesOutput> =>
  tool.execute!(
    {
      chantier_id,
      territoire_code: "REG-75",
      include_sous_territoires: false,
    },
    {
      toolCallId: "test",
      messages: [],
      abortSignal: undefined,
      context: {},
    },
  ) as Promise<GetChantierCommentairesOutput>;

describe("createGetChantierCommentairesTool execute", () => {
  test("retourne les commentaires d'un chantier accessible en texte, avec le nom du chantier", async () => {
    // Given
    const query = mock<GetChantierCommentairesQuery>({
      execute: vi.fn(async () => queryResult),
    });
    const tool = buildTool({
      query,
      territoiresAccessibles: ["REG-75"],
      chantiersAccessibles: ["CH-084"],
    });

    // When
    const result = await executeTool(tool, "CH-084");

    // Then
    expect(result).toEqual({
      chantier_nom: "Accélérer la rénovation énergétique",
      resultats: [
        {
          territoire_code: "REG-75",
          territoire_nom: "Île-de-France",
          chantier_id: "CH-084",
          commentaires: [
            {
              id: "commentaire-1",
              date_publication: "2026-01-12",
              contenu: "Deux postes vacants.\nRecrutement engagé.",
              type: "freins_a_lever",
            },
          ],
        },
      ],
      types_non_accessibles: [],
    });
  });

  test("refuse un chantier non accessible sans appeler la query", async () => {
    // Given — le territoire est accessible, mais pas le chantier
    const query = mock<GetChantierCommentairesQuery>({
      execute: vi.fn(async () => queryResult),
    });
    const tool = buildTool({
      query,
      territoiresAccessibles: ["REG-75"],
      chantiersAccessibles: ["CH-084"],
    });

    // When / Then
    await expect(executeTool(tool, "CH-062")).rejects.toThrow(
      "Accès non autorisé au chantier CH-062",
    );
    expect(query.execute).not.toHaveBeenCalled();
  });
});
