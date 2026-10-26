import { describe, expect, test } from "vitest";
import { mock } from "vitest-mock-extended";
import type { z } from "zod";
import {
  createGetChantiersTool,
  getChantiersInputSchema,
  type GetChantiersOutput,
} from "@/server/albert/tools/getChantiers";
import type {
  ChantiersReader,
  ReadChantiersResult,
} from "@/server/albert/services/ChantiersReader";
import type { GetChantiersResult } from "@/server/chantiers/query/GetChantiersQuery";

const resultat: GetChantiersResult = {
  territoire_code: "REG-53",
  territoire_nom: "Bretagne",
  jalon: 2025,
  chantiers: [],
};

const buildTool = (readerResult: ReadChantiersResult) => {
  const chantiersReader = mock<ChantiersReader>();
  chantiersReader.execute.mockResolvedValue(readerResult);
  const tool = createGetChantiersTool({ chantiersReader })({
    territoiresAccessibles: ["REG-53"],
    chantiersAccessibles: ["CH-001"],
  });
  return { tool, chantiersReader };
};

const executeTool = async (
  tool: ReturnType<ReturnType<typeof createGetChantiersTool>>,
  input: Partial<z.input<typeof getChantiersInputSchema>>,
): Promise<GetChantiersOutput> =>
  tool.execute!(
    getChantiersInputSchema.parse({
      territoire_code: "REG-53",
      jalon: 2025,
      ...input,
    }),
    {
      toolCallId: "test",
      messages: [],
      abortSignal: undefined,
      context: {},
    },
  ) as Promise<GetChantiersOutput>;

describe("createGetChantiersTool execute", () => {
  test("traduit notApplicable en non_applicable avec une liste vide", async () => {
    // Given
    const { tool } = buildTool({ kind: "notApplicable", raison: "raison" });

    // When
    const result = await executeTool(tool, { view: "en_retard" });

    // Then
    expect(result).toEqual({
      resultats: [],
      non_applicable: { raison: "raison" },
      _output_instructions: expect.stringContaining("non_applicable.raison"),
    });
  });

  test("traduit requestedChantiersNotAccessible en message dédié", async () => {
    // Given
    const { tool } = buildTool({ kind: "requestedChantiersNotAccessible" });

    // When
    const result = await executeTool(tool, { chantier_ids: ["CH-002"] });

    // Then
    expect(result).toEqual({
      resultats: [],
      _output_instructions:
        "Aucun des chantiers demandés n'est accessible pour cet utilisateur.",
    });
  });

  test("traduit noChantierAccessible en message dédié", async () => {
    // Given
    const { tool } = buildTool({ kind: "noChantierAccessible" });

    // When
    const result = await executeTool(tool, {});

    // Then
    expect(result).toEqual({
      resultats: [],
      _output_instructions:
        "L'utilisateur n'a accès à aucun chantier : aucune donnée ne peut être restituée.",
    });
  });

  test("rend les résultats avec la même instruction quelle que soit la vue", async () => {
    // Given
    const { tool } = buildTool({
      kind: "resultats",
      resultats: [resultat],
      restrictedTerritoires: [],
    });

    // When
    const resultAll = await executeTool(tool, { view: "all" });
    const resultEnRetard = await executeTool(tool, { view: "en_retard" });

    // Then
    expect(resultAll.resultats).toEqual([resultat]);
    expect(resultEnRetard._output_instructions).toEqual(
      resultAll._output_instructions,
    );
    expect(resultAll._output_instructions.startsWith("⚠️")).toBe(false);
  });

  test("préfixe l'avertissement de restriction quand des territoires sont restreints", async () => {
    // Given
    const { tool } = buildTool({
      kind: "resultats",
      resultats: [resultat],
      restrictedTerritoires: ["REG-52"],
    });

    // When
    const result = await executeTool(tool, {});

    // Then
    expect(
      result._output_instructions.startsWith(
        "⚠️ Restriction d'accès — territoires REG-52",
      ),
    ).toBe(true);
  });

  test("passe les paramètres et l'accès au reader", async () => {
    // Given
    const { tool, chantiersReader } = buildTool({
      kind: "resultats",
      resultats: [],
      restrictedTerritoires: [],
    });

    // When
    await executeTool(tool, {
      include_sous_territoires: true,
      tendance: "BAISSE",
    });

    // Then
    expect(chantiersReader.execute).toHaveBeenCalledWith(
      {
        territoireCode: "REG-53",
        jalon: 2025,
        includeSousTerritoires: true,
        chantierIds: undefined,
        view: "all",
        tendance: "BAISSE",
        meteo: undefined,
      },
      { territoiresAccessibles: ["REG-53"], chantiersAccessibles: ["CH-001"] },
    );
  });
});
