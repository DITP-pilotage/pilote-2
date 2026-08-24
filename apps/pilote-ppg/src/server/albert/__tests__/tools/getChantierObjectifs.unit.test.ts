import { describe, expect, test } from "vitest";
import { mock } from "vitest-mock-extended";
import {
  createGetChantierObjectifsTool,
  type GetChantierObjectifsOutput,
} from "@/server/albert/tools/getChantierObjectifs";
import type { GetChantierObjectifsQuery } from "@/server/chantiers/query/GetChantierObjectifsQuery";

const buildTool = ({
  queryResult,
  chantiersAccessibles,
}: {
  queryResult: Awaited<ReturnType<GetChantierObjectifsQuery["execute"]>>;
  chantiersAccessibles: string[];
}) => {
  const query = mock<GetChantierObjectifsQuery>({
    execute: async () => queryResult,
  });
  return createGetChantierObjectifsTool({ getChantierObjectifsQuery: query })({
    chantiersAccessibles,
  });
};

const executeTool = async (
  tool: ReturnType<ReturnType<typeof createGetChantierObjectifsTool>>,
  chantier_id: string,
): Promise<GetChantierObjectifsOutput> =>
  tool.execute!(
    { chantier_id },
    { toolCallId: "test", messages: [], abortSignal: undefined },
  ) as Promise<GetChantierObjectifsOutput>;

const resultWith3Objectifs = {
  chantier_id: "CH-001",
  objectifs: {
    notre_ambition: {
      date_publication: "2025-01-01T00:00:00.000Z",
      contenu: "<p>Ambition</p>",
    },
    deja_fait: {
      date_publication: "2025-01-02T00:00:00.000Z",
      contenu: "<p>Fait</p>",
    },
    a_faire: {
      date_publication: "2025-01-03T00:00:00.000Z",
      contenu: "<p>À faire</p>",
    },
  },
};

describe("createGetChantierObjectifsTool execute", () => {
  test("retourne les 3 objectifs quand tous sont publiés", async () => {
    // Given
    const tool = buildTool({
      queryResult: resultWith3Objectifs,
      chantiersAccessibles: ["CH-001"],
    });

    // When
    const result = await executeTool(tool, "CH-001");

    // Then
    expect(result).toEqual({
      chantier_id: "CH-001",
      objectifs: {
        notre_ambition: {
          date_publication: "2025-01-01T00:00:00.000Z",
          contenu: "<p>Ambition</p>",
        },
        deja_fait: {
          date_publication: "2025-01-02T00:00:00.000Z",
          contenu: "<p>Fait</p>",
        },
        a_faire: {
          date_publication: "2025-01-03T00:00:00.000Z",
          contenu: "<p>À faire</p>",
        },
      },
      _output_instructions: expect.any(String),
    });
  });

  test("retourne null pour un type absent", async () => {
    // Given — seul notre_ambition est publié
    const tool = buildTool({
      queryResult: {
        chantier_id: "CH-001",
        objectifs: {
          notre_ambition: {
            date_publication: "2025-01-01T00:00:00.000Z",
            contenu: "<p>Ambition</p>",
          },
          deja_fait: null,
          a_faire: null,
        },
      },
      chantiersAccessibles: ["CH-001"],
    });

    // When
    const result = await executeTool(tool, "CH-001");

    // Then
    expect(result).toEqual({
      chantier_id: "CH-001",
      objectifs: {
        notre_ambition: {
          date_publication: "2025-01-01T00:00:00.000Z",
          contenu: "<p>Ambition</p>",
        },
        deja_fait: null,
        a_faire: null,
      },
      _output_instructions: expect.any(String),
    });
  });

  test("retourne tous les champs null quand aucun objectif n'est publié", async () => {
    // Given
    const tool = buildTool({
      queryResult: {
        chantier_id: "CH-001",
        objectifs: { notre_ambition: null, deja_fait: null, a_faire: null },
      },
      chantiersAccessibles: ["CH-001"],
    });

    // When
    const result = await executeTool(tool, "CH-001");

    // Then
    expect(result).toEqual({
      chantier_id: "CH-001",
      objectifs: { notre_ambition: null, deja_fait: null, a_faire: null },
      _output_instructions: expect.any(String),
    });
  });

  test("lève une erreur si le chantier n'est pas accessible", async () => {
    // Given
    const tool = buildTool({
      queryResult: resultWith3Objectifs,
      chantiersAccessibles: ["CH-002"],
    });

    // When / Then
    await expect(executeTool(tool, "CH-001")).rejects.toThrow(
      "Accès non autorisé au chantier CH-001",
    );
  });

  test("ne retourne pas de données auteur", async () => {
    // Given
    const tool = buildTool({
      queryResult: resultWith3Objectifs,
      chantiersAccessibles: ["CH-001"],
    });

    // When
    const result = await executeTool(tool, "CH-001");

    // Then — aucun champ auteur dans les objectifs
    const objectifs = Object.values(result.objectifs).filter(Boolean);
    objectifs.forEach((objectif) => {
      expect(objectif).not.toHaveProperty("auteur");
    });
  });
});
