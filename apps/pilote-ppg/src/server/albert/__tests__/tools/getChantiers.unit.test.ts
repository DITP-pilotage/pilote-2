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
    mailles_applicables: ["NAT", "REG"],
  },
  meteo: "ORAGE",
  tendance: "BAISSE",
  ecart: -5,
  taux_avancement: 40,
  est_en_retard: false,
  est_en_difficulte: true,
  synthese: {
    meteo: "ORAGE",
    commentaire: "Deux postes restent vacants.",
    date_meteo: "2026-01-10",
    date_commentaire: "2026-01-12",
  },
  commentaires: { donnees: null, autresResultats: null },
});

// Le même chantier, tel que l'outil le renvoie : des libellés, pas des codes
const chantierRenvoye = (id: string) => ({
  chantier: {
    id,
    nom: `Chantier ${id}`,
    axe: "Axe",
    ppg: "PPG",
    ministeres: [],
    maille_de_pilotage: "régionale",
  },
  taux_avancement: 40,
  ecart: -5,
  tendance: "En baisse",
  niveau_de_confiance: "Objectifs compromis",
  est_en_retard: false,
  est_en_difficulte: true,
  synthese: {
    commentaire: "Deux postes restent vacants.",
    date_commentaire: "2026-01-12",
  },
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
        chantiers: [chantierRenvoye("CH-084")],
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
        chantiers: [chantierRenvoye("CH-084")],
      },
    ]);
  });

  test("signale un accès refusé quand aucun chantier_ids demandé n'est accessible", async () => {
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
      acces_refuse: true,
    });
    expect(query.execute).not.toHaveBeenCalled();
  });

  test("signale un accès refusé quand l'utilisateur n'a accès à aucun chantier", async () => {
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
      acces_refuse: true,
    });
    expect(query.execute).not.toHaveBeenCalled();
  });

  test("renvoie les libellés de la tendance, du niveau de confiance et de la maille de pilotage (D1)", async () => {
    // Given
    const tool = buildTool({
      query: buildQuery(["CH-084"]),
      territoiresAccessibles: ["REG-75"],
      chantiersAccessibles: ["CH-084"],
    });

    // When
    const result = await executeTool(tool, { territoire_code: "REG-75" });

    // Then
    expect(result.resultats).toEqual([
      {
        territoire_code: "REG-75",
        territoire_nom: "Île-de-France",
        jalon: 2026,
        chantiers: [chantierRenvoye("CH-084")],
      },
    ]);
  });

  test("hors périmètre, garde le niveau de confiance et masque la tendance et les commentaires", async () => {
    // Given
    const tool = buildTool({
      query: buildQuery(["CH-084"]),
      territoiresAccessibles: ["REG-53"],
      chantiersAccessibles: ["CH-084"],
    });

    // When
    const result = await executeTool(tool, { territoire_code: "REG-75" });

    // Then
    expect(result.resultats).toEqual([
      {
        territoire_code: "REG-75",
        territoire_nom: "Île-de-France",
        jalon: 2026,
        chantiers: [
          {
            ...chantierRenvoye("CH-084"),
            tendance: null,
            est_en_difficulte: false,
            synthese: { commentaire: null, date_commentaire: null },
          },
        ],
      },
    ]);
  });
});
