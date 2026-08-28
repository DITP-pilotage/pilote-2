import { afterEach, describe, expect, test, vi } from "vitest";
import { Albert } from "@/server/albert/Albert";
import { createSearchIndicateursTool } from "@/server/albert/tools/searchIndicateurs";
import type {
  GetIndicateursIdentiteQuery,
  IndicateurIdentiteResult,
} from "@/server/chantiers/query/GetIndicateursIdentiteQuery";

const buildQuery = (indicateurs: IndicateurIdentiteResult[]) => {
  const execute = vi.fn().mockResolvedValue(indicateurs);
  const query = { execute } as unknown as GetIndicateursIdentiteQuery;
  return { query, execute };
};

const buildTool = ({
  indicateurs,
  chantiersAccessibles,
}: {
  indicateurs: IndicateurIdentiteResult[];
  chantiersAccessibles: string[];
}) => {
  const { query, execute } = buildQuery(indicateurs);
  const tool = createSearchIndicateursTool({
    getIndicateursIdentiteQuery: query,
  })({ chantiersAccessibles });
  return { tool, execute };
};

const executeTool = (
  tool: ReturnType<ReturnType<typeof createSearchIndicateursTool>>,
  input: { query: string; chantier_ids?: string[] },
) =>
  tool.execute!(input, {
    toolCallId: "test",
    messages: [],
    abortSignal: undefined,
    context: {},
  });

const indicateur = (
  id: string,
  nom: string,
  chantierId: string,
): IndicateurIdentiteResult => ({
  id,
  nom,
  description: null,
  type_nom: "Impact",
  est_phare: false,
  chantier: { id: chantierId, nom: "Chantier " + chantierId },
});

describe("createSearchIndicateursTool execute", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("renvoie une liste vide sans appeler la query quand aucun chantier_ids demandé n'est accessible", async () => {
    // Given
    const { tool, execute } = buildTool({
      indicateurs: [],
      chantiersAccessibles: ["CH-001"],
    });

    // When
    const result = await executeTool(tool, {
      query: "x",
      chantier_ids: ["CH-999"],
    });

    // Then
    expect(execute).not.toHaveBeenCalled();
    expect(result).toEqual({
      indicateurs: [],
      reasoning:
        "Aucun des chantiers demandés n'est accessible pour cet utilisateur.",
      _output_instructions: expect.any(String),
    });
  });

  test("filtre les identifiants hallucinés par le sous-agent", async () => {
    // Given
    vi.spyOn(Albert, "generateStructuredOutput").mockResolvedValue({
      indicateurs: [
        {
          id: "IND-001",
          nom: "Réel",
          chantier: { id: "CH-001", nom: "Chantier CH-001" },
        },
        {
          id: "IND-999",
          nom: "Halluciné",
          chantier: { id: "CH-001", nom: "Chantier CH-001" },
        },
      ],
      reasoning: "test",
    });
    const { tool } = buildTool({
      indicateurs: [indicateur("IND-001", "Réel", "CH-001")],
      chantiersAccessibles: ["CH-001"],
    });

    // When
    const result = await executeTool(tool, { query: "x" });

    // Then
    expect(result).toEqual({
      indicateurs: [
        {
          id: "IND-001",
          nom: "Réel",
          chantier: { id: "CH-001", nom: "Chantier CH-001" },
        },
      ],
      reasoning: "test",
      _output_instructions: expect.any(String),
    });
  });

  test("renvoie une sortie vide quand aucun indicateur n'est accessible dans le périmètre", async () => {
    // Given
    const { tool } = buildTool({
      indicateurs: [],
      chantiersAccessibles: ["CH-001"],
    });

    // When
    const result = await executeTool(tool, { query: "x" });

    // Then
    expect(result).toEqual({
      indicateurs: [],
      reasoning: "Aucun indicateur accessible dans le périmètre demandé.",
      _output_instructions: expect.any(String),
    });
  });
});
