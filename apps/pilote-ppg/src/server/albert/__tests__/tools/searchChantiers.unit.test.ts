import { afterEach, describe, expect, test, vi } from "vitest";
import { Albert } from "@/server/albert/Albert";
import { createSearchChantiersTool } from "@/server/albert/tools/searchChantiers";
import type {
  ChantierIdentiteResult,
  GetChantiersIdentiteQuery,
} from "@/server/chantiers/query/GetChantiersIdentiteQuery";

const buildQuery = (chantiers: ChantierIdentiteResult[]) =>
  ({
    execute: vi.fn().mockResolvedValue(chantiers),
  }) as unknown as GetChantiersIdentiteQuery;

const buildTool = ({
  chantiers,
  chantiersAccessibles,
}: {
  chantiers: ChantierIdentiteResult[];
  chantiersAccessibles: string[];
}) =>
  createSearchChantiersTool({ getChantiersIdentiteQuery: buildQuery(chantiers) })(
    { chantiersAccessibles },
  );

const executeTool = (
  tool: ReturnType<ReturnType<typeof createSearchChantiersTool>>,
  query: string,
) =>
  tool.execute!(
    { query },
    { toolCallId: "test", messages: [], abortSignal: undefined },
  );

const chantier = (id: string, nom: string): ChantierIdentiteResult => ({
  id,
  nom,
  axe: "Axe",
  ppg: "PPG",
  ministeres: ["Ministère"],
});

describe("createSearchChantiersTool execute", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("renvoie une liste vide quand aucun chantier n'est accessible", async () => {
    // Given
    const tool = buildTool({ chantiers: [], chantiersAccessibles: [] });

    // When
    const result = await executeTool(tool, "les VSS");

    // Then
    expect(result).toEqual({
      chantiers: [],
      reasoning: "Aucun chantier accessible pour cet utilisateur.",
      _output_instructions: expect.any(String),
    });
  });

  test("filtre les identifiants hallucinés par le sous-agent", async () => {
    // Given
    vi.spyOn(Albert, "generateStructuredOutput").mockResolvedValue({
      chantiers: [
        { id: "CH-001", nom: "Réel" },
        { id: "CH-999", nom: "Halluciné" },
      ],
      reasoning: "test",
    });
    const tool = buildTool({
      chantiers: [chantier("CH-001", "Réel")],
      chantiersAccessibles: ["CH-001"],
    });

    // When
    const result = await executeTool(tool, "quelque chose");

    // Then
    expect(result).toEqual({
      chantiers: [{ id: "CH-001", nom: "Réel" }],
      reasoning: "test",
      _output_instructions: expect.any(String),
    });
  });

  test("renvoie une sortie vide avec les instructions _vide quand le sous-agent ne matche rien", async () => {
    // Given
    vi.spyOn(Albert, "generateStructuredOutput").mockResolvedValue({
      chantiers: [],
      reasoning: "Aucune correspondance",
    });
    const tool = buildTool({
      chantiers: [chantier("CH-001", "Réel")],
      chantiersAccessibles: ["CH-001"],
    });

    // When
    const result = await executeTool(tool, "rien");

    // Then
    expect(result).toEqual({
      chantiers: [],
      reasoning: "Aucune correspondance",
      _output_instructions: expect.any(String),
    });
  });
});
