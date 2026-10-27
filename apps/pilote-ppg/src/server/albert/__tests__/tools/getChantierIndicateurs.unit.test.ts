import { describe, expect, test, vi } from "vitest";
import { mock } from "vitest-mock-extended";
import {
  createGetChantierIndicateursTool,
  type GetChantierIndicateursOutput,
} from "@/server/albert/tools/getChantierIndicateurs";
import type {
  GetChantierIndicateursQuery,
  GetChantierIndicateursResult,
} from "@/server/chantiers/query/GetChantierIndicateursQuery";

const queryResult: GetChantierIndicateursResult = {
  territoire_code: "REG-75",
  chantier_id: "CH-084",
  indicateurs: [],
};

const buildTool = ({
  query,
  chantiersAccessibles,
}: {
  query: GetChantierIndicateursQuery;
  chantiersAccessibles: string[];
}) =>
  createGetChantierIndicateursTool({ getChantierIndicateursQuery: query })({
    chantiersAccessibles,
  });

const executeTool = async (
  tool: ReturnType<ReturnType<typeof createGetChantierIndicateursTool>>,
  input: { chantier_id: string; territoire_code: string },
): Promise<GetChantierIndicateursOutput> =>
  tool.execute!(
    { ...input, jalon: 2026 },
    {
      toolCallId: "test",
      messages: [],
      abortSignal: undefined,
      context: {},
    },
  ) as Promise<GetChantierIndicateursOutput>;

describe("createGetChantierIndicateursTool execute", () => {
  test("retourne les indicateurs d'un chantier accessible", async () => {
    // Given
    const query = mock<GetChantierIndicateursQuery>({
      execute: vi.fn(async () => queryResult),
    });
    const tool = buildTool({ query, chantiersAccessibles: ["CH-084"] });

    // When
    const result = await executeTool(tool, {
      chantier_id: "CH-084",
      territoire_code: "REG-75",
    });

    // Then
    expect(result).toEqual({
      resultats: queryResult,
      _output_instructions: expect.any(String),
    });
  });

  test("refuse un chantier non accessible sans appeler la query", async () => {
    // Given
    const query = mock<GetChantierIndicateursQuery>({
      execute: vi.fn(async () => queryResult),
    });
    const tool = buildTool({ query, chantiersAccessibles: ["CH-084"] });

    // When / Then
    await expect(
      executeTool(tool, { chantier_id: "CH-062", territoire_code: "REG-75" }),
    ).rejects.toThrow("Accès non autorisé au chantier CH-062");
    expect(query.execute).not.toHaveBeenCalled();
  });
});
