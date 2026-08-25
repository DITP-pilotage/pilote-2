import { describe, expect, test } from "vitest";
import { mock } from "vitest-mock-extended";
import {
  createGetChantierCommentairesTool,
  type GetChantierCommentairesOutput,
} from "@/server/albert/tools/getChantierCommentaires";
import type { GetChantierCommentairesQuery } from "@/server/chantiers/query/GetChantierCommentairesQuery";
import type { TerritoireResolver } from "@/server/albert/domain/TerritoireResolver";

const buildTool = ({
  queryResult,
  territoiresAccessibles,
  resolvedCodes,
}: {
  queryResult: Awaited<ReturnType<GetChantierCommentairesQuery["execute"]>>;
  territoiresAccessibles: string[];
  resolvedCodes?: string[];
}) => {
  const query = mock<GetChantierCommentairesQuery>({
    execute: async () => queryResult,
  });
  const resolver = mock<TerritoireResolver>({
    resoudre: async (code) => resolvedCodes ?? [code],
  });
  return createGetChantierCommentairesTool({
    getChantierCommentairesQuery: query,
    territoireResolver: resolver,
  })({ territoiresAccessibles });
};

const executeTool = async (
  tool: ReturnType<ReturnType<typeof createGetChantierCommentairesTool>>,
  input: { chantier_id: string; territoire_code: string; include_sous_territoires?: boolean },
): Promise<GetChantierCommentairesOutput> =>
  tool.execute!(
    { include_sous_territoires: false, ...input },
    { toolCallId: "test", messages: [], abortSignal: undefined },
  ) as Promise<GetChantierCommentairesOutput>;

const resultNatFr = {
  territoire_code: "NAT-FR",
  maille: "nationale" as const,
  synthese_des_resultats: {
    meteo: { valeur: "SOLEIL", libelle: "Objectifs sécurisés" },
    contenu: "Bilan positif",
    date_publication: "2025-01-01T00:00:00.000Z",
  },
  commentaires: [
    {
      type: "freins_a_lever",
      contenu: "Manque de ressources",
      date_publication: "2025-01-02T00:00:00.000Z",
    },
  ],
  decisions_strategiques: [
    {
      contenu: "Décision Élysée du 15 janvier",
      date_publication: "2025-01-15T00:00:00.000Z",
    },
  ],
};

const resultReg11 = {
  territoire_code: "REG-11",
  maille: "régionale" as const,
  synthese_des_resultats: null,
  commentaires: [
    {
      type: "commentaires_sur_les_donnees",
      contenu: "Données stables",
      date_publication: "2025-01-03T00:00:00.000Z",
    },
  ],
  decisions_strategiques: [],
};

const resultVide = {
  territoire_code: "REG-84",
  maille: "régionale" as const,
  synthese_des_resultats: null,
  commentaires: [],
  decisions_strategiques: [],
};

describe("createGetChantierCommentairesTool execute", () => {
  test("lève une erreur si le territoire principal n'est pas accessible", async () => {
    const tool = buildTool({
      queryResult: resultReg11,
      territoiresAccessibles: ["REG-84"],
    });

    await expect(
      executeTool(tool, { chantier_id: "CH-001", territoire_code: "REG-11" }),
    ).rejects.toThrow("Accès non autorisé au territoire REG-11");
  });

  test("retourne les commentaires et la synthèse pour un territoire accessible", async () => {
    const tool = buildTool({
      queryResult: resultReg11,
      territoiresAccessibles: ["REG-11"],
    });

    const result = await executeTool(tool, {
      chantier_id: "CH-001",
      territoire_code: "REG-11",
    });

    expect(result).toEqual({
      resultats: [resultReg11],
      _output_instructions: expect.any(String),
    });
  });

  test("retourne un territoire sans contenu avec tableaux vides et synthèse null", async () => {
    const tool = buildTool({
      queryResult: resultVide,
      territoiresAccessibles: ["REG-84"],
    });

    const result = await executeTool(tool, {
      chantier_id: "CH-001",
      territoire_code: "REG-84",
    });

    expect(result.resultats).toEqual([
      {
        territoire_code: "REG-84",
        maille: "régionale",
        synthese_des_resultats: null,
        commentaires: [],
        decisions_strategiques: [],
      },
    ]);
  });

  test("inclut les décisions stratégiques quand le territoire est NAT-FR", async () => {
    const tool = buildTool({
      queryResult: resultNatFr,
      territoiresAccessibles: ["NAT-FR"],
    });

    const result = await executeTool(tool, {
      chantier_id: "CH-001",
      territoire_code: "NAT-FR",
    });

    expect(result.resultats[0].decisions_strategiques).toEqual([
      {
        contenu: "Décision Élysée du 15 janvier",
        date_publication: "2025-01-15T00:00:00.000Z",
      },
    ]);
  });

  test("n'expose pas les décisions stratégiques pour un territoire régional", async () => {
    const tool = buildTool({
      queryResult: resultReg11,
      territoiresAccessibles: ["REG-11"],
    });

    const result = await executeTool(tool, {
      chantier_id: "CH-001",
      territoire_code: "REG-11",
    });

    expect(result.resultats[0].decisions_strategiques).toEqual([]);
  });

  test("exclut NAT-FR des codes résolus si absent de territoiresAccessibles", async () => {
    // NAT-FR résolu par include_sous_territoires mais non accessible
    const queryMock = mock<GetChantierCommentairesQuery>({
      execute: async (params) =>
        params.territoireCode === "REG-11" ? resultReg11 : resultNatFr,
    });
    const resolver = mock<TerritoireResolver>({
      resoudre: async () => ["NAT-FR", "REG-11"],
    });
    const tool = createGetChantierCommentairesTool({
      getChantierCommentairesQuery: queryMock,
      territoireResolver: resolver,
    })({ territoiresAccessibles: ["REG-11"] });

    const result = await executeTool(tool, {
      chantier_id: "CH-001",
      territoire_code: "REG-11",
      include_sous_territoires: true,
    });

    const codes = result.resultats.map((r) => r.territoire_code);
    expect(codes).not.toContain("NAT-FR");
    expect(codes).toContain("REG-11");
  });

  test("ne retourne pas de données auteur dans les commentaires", async () => {
    const tool = buildTool({
      queryResult: resultNatFr,
      territoiresAccessibles: ["NAT-FR"],
    });

    const result = await executeTool(tool, {
      chantier_id: "CH-001",
      territoire_code: "NAT-FR",
    });

    result.resultats[0].commentaires.forEach((commentaire) => {
      expect(commentaire).not.toHaveProperty("auteur");
    });
    result.resultats[0].decisions_strategiques.forEach((decision) => {
      expect(decision).not.toHaveProperty("auteur");
    });
    if (result.resultats[0].synthese_des_resultats) {
      expect(result.resultats[0].synthese_des_resultats).not.toHaveProperty("auteur");
    }
  });
});
