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
import { personReference } from "@/shared/personne/personReference";

const RESPONSABLE_ID = "0b3c1f2e-8a4d-4c6b-9e1f-2a3b4c5d6e7f";

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

  test("cite les responsables des données par leur référence", async () => {
    // Given
    const indicateur = {
      indicateur_id: "IND-001",
      nom: "Indicateur",
      unite_mesure: null,
      valeur_initiale: null,
      date_valeur_initiale: null,
      valeur_actuelle: null,
      date_valeur_actuelle: null,
      valeur_cible: null,
      date_valeur_cible: null,
      taux_avancement: null,
    };
    const query = mock<GetChantierIndicateursQuery>({
      execute: vi.fn(async () => ({
        ...queryResult,
        indicateurs: [
          { ...indicateur, responsables_donnees_ids: [RESPONSABLE_ID] },
        ],
      })),
    });
    const tool = buildTool({ query, chantiersAccessibles: ["CH-084"] });

    // When
    const result = await executeTool(tool, {
      chantier_id: "CH-084",
      territoire_code: "REG-75",
    });

    // Then
    expect(result.resultats.indicateurs).toEqual([
      {
        ...indicateur,
        responsables_donnees: [personReference(RESPONSABLE_ID)],
      },
    ]);
  });
});
