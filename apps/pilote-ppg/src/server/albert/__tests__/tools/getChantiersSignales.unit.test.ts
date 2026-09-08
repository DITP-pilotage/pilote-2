import { describe, expect, test } from "vitest";
import { mock } from "vitest-mock-extended";
import {
  createGetChantiersSignalesTool,
  type GetChantiersSignalesOutput,
} from "@/server/albert/tools/getChantiersSignales";
import type { GetChantiersSignalesDetailQuery } from "@/server/chantiers/infrastructure/queries/GetChantiersSignalesDetailQuery";

const buildTool = ({
  queryResult,
  territoiresAccessibles,
  chantiersAccessibles,
}: {
  queryResult: Awaited<ReturnType<GetChantiersSignalesDetailQuery["execute"]>>;
  territoiresAccessibles: string[];
  chantiersAccessibles: string[];
}) => {
  const query = mock<GetChantiersSignalesDetailQuery>({
    execute: async () => queryResult,
  });
  return createGetChantiersSignalesTool({
    getChantiersSignalesDetailQuery: query,
  })({ territoiresAccessibles, chantiersAccessibles });
};

const executeTool = async (
  tool: ReturnType<ReturnType<typeof createGetChantiersSignalesTool>>,
  input: {
    territoire_code: string;
    jalon: number;
    categories?: string[];
    chantier_ids?: string[];
  },
): Promise<GetChantiersSignalesOutput> =>
  tool.execute!(input, {
    toolCallId: "test",
    messages: [],
    abortSignal: undefined,
    context: {},
  }) as Promise<GetChantiersSignalesOutput>;

describe("createGetChantiersSignalesTool execute", () => {
  test("refuse l'accès à un territoire non accessible sans appeler la query", async () => {
    // Given
    const tool = buildTool({
      queryResult: [],
      territoiresAccessibles: ["NAT-FR"],
      chantiersAccessibles: ["CH-001"],
    });

    // When
    const result = await executeTool(tool, {
      territoire_code: "REG-11",
      jalon: 2025,
    });

    // Then
    expect(result).toEqual({
      resultats: [],
      acces_refuse: true,
      _output_instructions: expect.any(String),
    });
  });

  test("retourne un message dédié quand aucun chantier_ids demandé n'est accessible", async () => {
    // Given
    const tool = buildTool({
      queryResult: [],
      territoiresAccessibles: ["NAT-FR"],
      chantiersAccessibles: ["CH-002"],
    });

    // When
    const result = await executeTool(tool, {
      territoire_code: "NAT-FR",
      jalon: 2025,
      chantier_ids: ["CH-001"],
    });

    // Then
    expect(result).toEqual({
      resultats: [],
      _output_instructions:
        "Aucun des chantiers demandés n'est accessible pour cet utilisateur.",
    });
  });

  test("sépare les catégories applicables et non applicables au national", async () => {
    // Given — ecart/baisse ne sont pas applicables au national
    const tool = buildTool({
      queryResult: [
        {
          id: "CH-001",
          nom: "CH-001 — Chantier test",
          meteo: "NON_RENSEIGNEE",
          ecart: null,
          categories: ["meteo_non_renseignee"],
        },
      ],
      territoiresAccessibles: ["NAT-FR"],
      chantiersAccessibles: ["CH-001"],
    });

    // When
    const result = await executeTool(tool, {
      territoire_code: "NAT-FR",
      jalon: 2025,
      categories: ["ecart", "meteo_non_renseignee"],
    });

    // Then
    expect(result).toEqual({
      resultats: [
        {
          id: "CH-001",
          nom: "CH-001 — Chantier test",
          meteo: "NON_RENSEIGNEE",
          ecart: null,
          categories: ["meteo_non_renseignee"],
        },
      ],
      categories_non_applicables: [
        {
          categorie: "ecart",
          raison: expect.any(String),
        },
      ],
      _output_instructions: expect.any(String),
    });
  });

  test("sépare les catégories applicables et non applicables au régional", async () => {
    // Given — taux_non_calcule n'est pas applicable au régional
    const tool = buildTool({
      queryResult: [],
      territoiresAccessibles: ["REG-11"],
      chantiersAccessibles: ["CH-001"],
    });

    // When
    const result = await executeTool(tool, {
      territoire_code: "REG-11",
      jalon: 2025,
      categories: ["taux_non_calcule", "ecart"],
    });

    // Then
    expect(result).toEqual({
      resultats: [],
      categories_non_applicables: [
        {
          categorie: "taux_non_calcule",
          raison: expect.any(String),
        },
      ],
      _output_instructions: expect.any(String),
    });
  });

  test("sépare les catégories applicables et non applicables au départemental", async () => {
    // Given — absence_taux_departemental n'est pas applicable au départemental
    const tool = buildTool({
      queryResult: [],
      territoiresAccessibles: ["DEPT-75"],
      chantiersAccessibles: ["CH-001"],
    });

    // When
    const result = await executeTool(tool, {
      territoire_code: "DEPT-75",
      jalon: 2025,
      categories: ["absence_taux_departemental", "baisse"],
    });

    // Then
    expect(result).toEqual({
      resultats: [],
      categories_non_applicables: [
        {
          categorie: "absence_taux_departemental",
          raison: expect.any(String),
        },
      ],
      _output_instructions: expect.any(String),
    });
  });

  test("interroge toutes les catégories applicables à la maille quand categories est absent", async () => {
    // Given
    const tool = buildTool({
      queryResult: [],
      territoiresAccessibles: ["NAT-FR"],
      chantiersAccessibles: ["CH-001"],
    });

    // When
    const result = await executeTool(tool, {
      territoire_code: "NAT-FR",
      jalon: 2025,
    });

    // Then — pas de categories_non_applicables, toutes les catégories nationales ont été interrogées
    expect(result).toEqual({
      resultats: [],
      _output_instructions: expect.any(String),
    });
  });
});
