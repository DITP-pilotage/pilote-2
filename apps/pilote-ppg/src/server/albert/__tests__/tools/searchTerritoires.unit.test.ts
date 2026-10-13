import type { Maille } from "@prisma/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import { Albert } from "@/server/albert/Albert";
import { createSearchTerritoiresTool } from "@/server/albert/tools/searchTerritoires";
import type {
  GetTerritoiresIdentiteQuery,
  TerritoireIdentiteResult,
} from "@/server/chantiers/query/GetTerritoiresIdentiteQuery";

const buildTool = (
  territoires: TerritoireIdentiteResult[],
  territoiresAccessibles: string[] = territoires.map(
    (territoire) => territoire.code,
  ),
) => {
  const query = {
    execute: vi.fn().mockResolvedValue(territoires),
  } as unknown as GetTerritoiresIdentiteQuery;
  return createSearchTerritoiresTool({ getTerritoiresIdentiteQuery: query })({
    territoiresAccessibles,
  });
};

const executeTool = (
  tool: ReturnType<ReturnType<typeof createSearchTerritoiresTool>>,
  query: string,
) =>
  tool.execute!(
    { query },
    {
      toolCallId: "test",
      messages: [],
      abortSignal: undefined,
      context: {},
    },
  );

const territoire = (
  code: string,
  nom: string,
  maille: Maille,
): TerritoireIdentiteResult => ({
  code,
  nom,
  maille,
  code_parent: null,
});

describe("createSearchTerritoiresTool execute", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("filtre les codes hallucinés par le sous-agent", async () => {
    // Given
    vi.spyOn(Albert, "generateStructuredOutput").mockResolvedValue({
      territoires: [
        { code: "REG-53", nom: "Bretagne", maille: "regionale" },
        { code: "REG-99", nom: "Inventé", maille: "regionale" },
      ],
      reasoning: "test",
    });
    const tool = buildTool([
      territoire("REG-53", "Bretagne", "regionale" as Maille),
    ]);

    // When
    const result = await executeTool(tool, "la Bretagne");

    // Then
    expect(result).toEqual({
      territoires: [
        {
          code: "REG-53",
          nom: "Bretagne",
          maille: "regionale",
          donnees_accessibles: "QUANTITATIVES_ET_QUALITATIVES",
        },
      ],
      reasoning: "test",
      _output_instructions: expect.any(String),
    });
  });

  test("renvoie une sortie vide avec les instructions _vide quand le sous-agent ne matche rien", async () => {
    // Given
    vi.spyOn(Albert, "generateStructuredOutput").mockResolvedValue({
      territoires: [],
      reasoning: "Aucune correspondance",
    });
    const tool = buildTool([
      territoire("REG-53", "Bretagne", "regionale" as Maille),
    ]);

    // When
    const result = await executeTool(tool, "Pas un territoire");

    // Then
    expect(result).toEqual({
      territoires: [],
      reasoning: "Aucune correspondance",
      _output_instructions: expect.any(String),
    });
  });

  test("indique les données accessibles selon les habilitations de l'utilisateur", async () => {
    // Given
    vi.spyOn(Albert, "generateStructuredOutput").mockResolvedValue({
      territoires: [
        { code: "REG-53", nom: "Bretagne", maille: "regionale" },
        { code: "REG-52", nom: "Pays de la Loire", maille: "regionale" },
      ],
      reasoning: "test",
    });
    const tool = buildTool(
      [
        territoire("REG-53", "Bretagne", "regionale" as Maille),
        territoire("REG-52", "Pays de la Loire", "regionale" as Maille),
      ],
      // l'utilisateur n'est habilité que sur la Bretagne
      ["REG-53"],
    );

    // When
    const result = await executeTool(
      tool,
      "la Bretagne et les Pays de la Loire",
    );

    // Then
    expect(result).toEqual({
      territoires: [
        {
          code: "REG-53",
          nom: "Bretagne",
          maille: "regionale",
          donnees_accessibles: "QUANTITATIVES_ET_QUALITATIVES",
        },
        {
          code: "REG-52",
          nom: "Pays de la Loire",
          maille: "regionale",
          donnees_accessibles: "QUANTITATIVES",
        },
      ],
      reasoning: "test",
      _output_instructions: expect.any(String),
    });
  });
});
