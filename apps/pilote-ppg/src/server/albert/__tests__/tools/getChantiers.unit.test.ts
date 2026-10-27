import { describe, expect, test, vi } from "vitest";
import { mock } from "vitest-mock-extended";
import {
  createGetChantiersTool,
  type GetChantiersOutput,
} from "@/server/albert/tools/getChantiers";
import type {
  ChantierResult,
  GetChantiersParams,
  GetChantiersQuery,
} from "@/server/chantiers/query/GetChantiersQuery";
import type { TerritoireResolver } from "@/server/albert/domain/TerritoireResolver";

const buildChantier = (id: string): ChantierResult => ({
  chantier: {
    id,
    nom: `Chantier ${id}`,
    axe: "Axe",
    ppg: "PPG",
    ministeres: [],
    mailles_applicables: ["REG"],
  },
  meteo: "ORAGE",
  tendance: "BAISSE",
  ecart: -5,
  taux_avancement: 40,
  est_en_retard: false,
  est_en_difficulte: true,
  synthese: null,
  commentaires: { donnees: null, autresResultats: null },
});

// La query ne filtre sur chantierIds que si la liste est non vide, comme GetChantiersQuery
const buildQuery = (chantiersDuTerritoire: string[]) =>
  mock<GetChantiersQuery>({
    execute: vi.fn(async (params: GetChantiersParams) => ({
      territoire_code: params.territoireCode,
      territoire_nom: "Île-de-France",
      jalon: params.jalon,
      chantiers: chantiersDuTerritoire
        .filter(
          (id) =>
            !params.chantierIds ||
            params.chantierIds.length === 0 ||
            params.chantierIds.includes(id),
        )
        .map(buildChantier),
    })),
  });

const buildTool = ({
  query,
  territoiresAccessibles,
  chantiersAccessibles,
}: {
  query: GetChantiersQuery;
  territoiresAccessibles: string[];
  chantiersAccessibles: string[];
}) => {
  const territoireResolver = mock<TerritoireResolver>({
    resoudre: async (territoireCode: string) => [territoireCode],
  });
  return createGetChantiersTool({
    getChantiersQuery: query,
    territoireResolver,
  })({ territoiresAccessibles, chantiersAccessibles });
};

const executeTool = async (
  tool: ReturnType<ReturnType<typeof createGetChantiersTool>>,
  input: {
    territoire_code: string;
    chantier_ids?: string[];
    view?: "all" | "en_retard" | "en_difficulte";
  },
): Promise<GetChantiersOutput> =>
  tool.execute!(
    {
      jalon: 2026,
      include_sous_territoires: false,
      ...input,
      view: input.view ?? "all",
    },
    {
      toolCallId: "test",
      messages: [],
      abortSignal: undefined,
      context: {},
    },
  ) as Promise<GetChantiersOutput>;

describe("createGetChantiersTool execute", () => {
  test("sans chantier_ids, ne retourne que les chantiers accessibles à l'utilisateur", async () => {
    // Given
    const tool = buildTool({
      query: buildQuery(["CH-062", "CH-084"]),
      territoiresAccessibles: ["REG-75"],
      chantiersAccessibles: ["CH-084"],
    });

    // When
    const result = await executeTool(tool, {
      territoire_code: "REG-75",
      view: "en_difficulte",
    });

    // Then
    expect(result.resultats).toEqual([
      {
        territoire_code: "REG-75",
        territoire_nom: "Île-de-France",
        jalon: 2026,
        chantiers: [buildChantier("CH-084")],
      },
    ]);
  });

  test("avec chantier_ids, exclut les chantiers non accessibles", async () => {
    // Given
    const tool = buildTool({
      query: buildQuery(["CH-062", "CH-084"]),
      territoiresAccessibles: ["REG-75"],
      chantiersAccessibles: ["CH-084"],
    });

    // When
    const result = await executeTool(tool, {
      territoire_code: "REG-75",
      chantier_ids: ["CH-062", "CH-084"],
    });

    // Then
    expect(result.resultats).toEqual([
      {
        territoire_code: "REG-75",
        territoire_nom: "Île-de-France",
        jalon: 2026,
        chantiers: [buildChantier("CH-084")],
      },
    ]);
  });

  test("retourne un message dédié quand aucun chantier_ids demandé n'est accessible", async () => {
    // Given
    const query = buildQuery(["CH-062", "CH-084"]);
    const tool = buildTool({
      query,
      territoiresAccessibles: ["REG-75"],
      chantiersAccessibles: ["CH-084"],
    });

    // When
    const result = await executeTool(tool, {
      territoire_code: "REG-75",
      chantier_ids: ["CH-062"],
    });

    // Then
    expect(result).toEqual({
      resultats: [],
      _output_instructions:
        "Aucun des chantiers demandés n'est accessible pour cet utilisateur.",
    });
    expect(query.execute).not.toHaveBeenCalled();
  });

  test("ne retourne aucun chantier quand l'utilisateur n'a accès à aucun chantier", async () => {
    // Given
    const query = buildQuery(["CH-062", "CH-084"]);
    const tool = buildTool({
      query,
      territoiresAccessibles: ["REG-75"],
      chantiersAccessibles: [],
    });

    // When
    const result = await executeTool(tool, { territoire_code: "REG-75" });

    // Then
    expect(result).toEqual({
      resultats: [],
      _output_instructions:
        "L'utilisateur n'a accès à aucun chantier : aucune donnée ne peut être restituée.",
    });
    expect(query.execute).not.toHaveBeenCalled();
  });
});
