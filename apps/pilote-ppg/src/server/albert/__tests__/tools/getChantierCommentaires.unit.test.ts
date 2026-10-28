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
import type { Perimetre } from "@/server/albert/domain/Perimetre";
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

type CommentaireDeLaQuery =
  GetChantierCommentairesQueryResult["resultats"][number]["commentaires"][number];

const commentaire = ({
  date_publication,
  type,
  contenu,
}: Omit<CommentaireDeLaQuery, "id">): CommentaireDeLaQuery => ({
  id: `${type}-${date_publication}`,
  date_publication,
  type,
  contenu,
});

const resultatAvecCommentaires = (
  commentaires: CommentaireDeLaQuery[],
): GetChantierCommentairesQueryResult => ({
  resultats: [{ ...queryResult.resultats[0], commentaires }],
  types_non_accessibles: [],
});

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
    resoudre: async (perimetre: Perimetre) =>
      perimetre.type === "SELECTION" ? perimetre.territoire_codes : [],
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
              type: "freins_a_lever",
              versions: [
                {
                  date_publication: "2026-01-12",
                  contenu: "Deux postes vacants.\nRecrutement engagé.",
                },
              ],
            },
          ],
        },
      ],
      types_non_accessibles: [],
    });
  });

  test("regroupe les versions par type, du type mis à jour le plus récemment au plus ancien", async () => {
    // Given — la query renvoie les commentaires du plus récent au plus ancien
    const query = mock<GetChantierCommentairesQuery>({
      execute: vi.fn(async () =>
        resultatAvecCommentaires([
          commentaire({
            date_publication: "2026-02-26",
            type: "commentaires_sur_les_donnees",
            contenu: "<p>Données v2</p>",
          }),
          commentaire({
            date_publication: "2026-02-20",
            type: "synthese_des_resultats",
            contenu: "<p>Synthèse v2</p>",
          }),
          commentaire({
            date_publication: "2025-03-07",
            type: "commentaires_sur_les_donnees",
            contenu: "<p>Données v1</p>",
          }),
          commentaire({
            date_publication: "2024-12-26",
            type: "synthese_des_resultats",
            contenu: "<p>Synthèse v1</p>",
          }),
        ]),
      ),
    });
    const tool = buildTool({
      query,
      territoiresAccessibles: ["REG-75"],
      chantiersAccessibles: ["CH-084"],
    });

    // When
    const result = await executeTool(tool, "CH-084");

    // Then
    expect(result.resultats[0].commentaires).toEqual([
      {
        type: "commentaires_sur_les_donnees",
        versions: [
          { date_publication: "2026-02-26", contenu: "Données v2" },
          { date_publication: "2025-03-07", contenu: "Données v1" },
        ],
      },
      {
        type: "synthese_des_resultats",
        versions: [
          { date_publication: "2026-02-20", contenu: "Synthèse v2" },
          { date_publication: "2024-12-26", contenu: "Synthèse v1" },
        ],
      },
    ]);
  });

  test("fusionne les versions consécutives au texte identique en gardant la date la plus récente", async () => {
    // Given — la synthèse est réenregistrée à l'identique (au HTML et aux
    // espaces près), puis réécrite, puis revient à son texte d'origine
    const query = mock<GetChantierCommentairesQuery>({
      execute: vi.fn(async () =>
        resultatAvecCommentaires([
          commentaire({
            date_publication: "2026-02-26",
            type: "synthese_des_resultats",
            contenu: "<p>Enjeux importants.</p>",
          }),
          commentaire({
            date_publication: "2025-03-07",
            type: "synthese_des_resultats",
            contenu: "<p>Enjeux majeurs.</p>",
          }),
          commentaire({
            date_publication: "2024-12-26",
            type: "synthese_des_resultats",
            contenu: "<p>Enjeux  importants.</p>",
          }),
          commentaire({
            date_publication: "2024-11-12",
            type: "synthese_des_resultats",
            contenu: "<div>Enjeux importants.</div>",
          }),
        ]),
      ),
    });
    const tool = buildTool({
      query,
      territoiresAccessibles: ["REG-75"],
      chantiersAccessibles: ["CH-084"],
    });

    // When
    const result = await executeTool(tool, "CH-084");

    // Then
    expect(result.resultats[0].commentaires).toEqual([
      {
        type: "synthese_des_resultats",
        versions: [
          { date_publication: "2026-02-26", contenu: "Enjeux importants." },
          { date_publication: "2025-03-07", contenu: "Enjeux majeurs." },
          { date_publication: "2024-12-26", contenu: "Enjeux  importants." },
        ],
      },
    ]);
  });

  test("garde un même texte publié sous deux types différents", async () => {
    // Given
    const query = mock<GetChantierCommentairesQuery>({
      execute: vi.fn(async () =>
        resultatAvecCommentaires([
          commentaire({
            date_publication: "2026-02-26",
            type: "autres_resultats_obtenus",
            contenu: "<p>Campagne de vaccination lancée.</p>",
          }),
          commentaire({
            date_publication: "2026-02-25",
            type: "commentaires_sur_les_donnees",
            contenu: "<p>Campagne de vaccination lancée.</p>",
          }),
        ]),
      ),
    });
    const tool = buildTool({
      query,
      territoiresAccessibles: ["REG-75"],
      chantiersAccessibles: ["CH-084"],
    });

    // When
    const result = await executeTool(tool, "CH-084");

    // Then
    expect(result.resultats[0].commentaires).toEqual([
      {
        type: "autres_resultats_obtenus",
        versions: [
          {
            date_publication: "2026-02-26",
            contenu: "Campagne de vaccination lancée.",
          },
        ],
      },
      {
        type: "commentaires_sur_les_donnees",
        versions: [
          {
            date_publication: "2026-02-25",
            contenu: "Campagne de vaccination lancée.",
          },
        ],
      },
    ]);
  });

  test("trie les versions du plus récent au plus ancien, quel que soit l'ordre de la query", async () => {
    // Given — la query renvoie les commentaires dans le désordre, et les deux
    // versions identiques ne se suivent pas
    const query = mock<GetChantierCommentairesQuery>({
      execute: vi.fn(async () =>
        resultatAvecCommentaires([
          commentaire({
            date_publication: "2024-11-12",
            type: "synthese_des_resultats",
            contenu: "<p>Enjeux importants.</p>",
          }),
          commentaire({
            date_publication: "2026-02-26",
            type: "commentaires_sur_les_donnees",
            contenu: "<p>Données v2</p>",
          }),
          commentaire({
            date_publication: "2025-03-07",
            type: "synthese_des_resultats",
            contenu: "<p>Enjeux majeurs.</p>",
          }),
          commentaire({
            date_publication: "2024-12-26",
            type: "synthese_des_resultats",
            contenu: "<p>Enjeux importants.</p>",
          }),
        ]),
      ),
    });
    const tool = buildTool({
      query,
      territoiresAccessibles: ["REG-75"],
      chantiersAccessibles: ["CH-084"],
    });

    // When
    const result = await executeTool(tool, "CH-084");

    // Then
    expect(result.resultats[0].commentaires).toEqual([
      {
        type: "commentaires_sur_les_donnees",
        versions: [{ date_publication: "2026-02-26", contenu: "Données v2" }],
      },
      {
        type: "synthese_des_resultats",
        versions: [
          { date_publication: "2025-03-07", contenu: "Enjeux majeurs." },
          { date_publication: "2024-12-26", contenu: "Enjeux importants." },
        ],
      },
    ]);
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
