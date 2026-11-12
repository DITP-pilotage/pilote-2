import { describe, expect, test } from "vitest";
import { mock } from "vitest-mock-extended";
import {
  createGetChantierObjectifsTool,
  type GetChantierObjectifsOutput,
} from "@/server/albert/tools/getChantierObjectifs";
import type { GetChantierObjectifsQuery } from "@/server/chantiers/query/GetChantierObjectifsQuery";
import { personReference } from "@/shared/personne/personReference";

const AUTEUR_ID = "0b3c1f2e-8a4d-4c6b-9e1f-2a3b4c5d6e7f";
const MODIFICATEUR_ID = "9f8e7d6c-5b4a-4c3d-8e2f-1a0b9c8d7e6f";
const REFERENCE_AUTEUR = personReference(AUTEUR_ID);

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
    {
      toolCallId: "test",
      messages: [],
      abortSignal: undefined,
      context: {},
    },
  ) as Promise<GetChantierObjectifsOutput>;

const resultWith3Objectifs = {
  chantier_id: "CH-001",
  objectifs: {
    notre_ambition: {
      date_publication: "2025-01-01T00:00:00.000Z",
      contenu: "<p>Ambition</p>",
      auteur_creation_id: AUTEUR_ID,
      auteur_modification_id: AUTEUR_ID,
    },
    deja_fait: {
      date_publication: "2025-01-02T00:00:00.000Z",
      contenu: "<p>Fait</p>",
      auteur_creation_id: AUTEUR_ID,
      auteur_modification_id: AUTEUR_ID,
    },
    a_faire: {
      date_publication: "2025-01-03T00:00:00.000Z",
      contenu: "<p>À faire</p>",
      auteur_creation_id: AUTEUR_ID,
      auteur_modification_id: AUTEUR_ID,
    },
  },
};

describe("createGetChantierObjectifsTool execute", () => {
  test("retourne les 3 objectifs quand tous sont publiés, en texte", async () => {
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
          contenu: "Ambition",
          auteur: REFERENCE_AUTEUR,
        },
        deja_fait: {
          date_publication: "2025-01-02T00:00:00.000Z",
          contenu: "Fait",
          auteur: REFERENCE_AUTEUR,
        },
        a_faire: {
          date_publication: "2025-01-03T00:00:00.000Z",
          contenu: "À faire",
          auteur: REFERENCE_AUTEUR,
        },
      },
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
            auteur_creation_id: AUTEUR_ID,
            auteur_modification_id: AUTEUR_ID,
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
          contenu: "Ambition",
          auteur: REFERENCE_AUTEUR,
        },
        deja_fait: null,
        a_faire: null,
      },
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

  test("cite aussi la personne qui a modifié un objectif quand ce n'est pas son auteur", async () => {
    // Given
    const tool = buildTool({
      queryResult: {
        chantier_id: "CH-001",
        objectifs: {
          notre_ambition: {
            date_publication: "2025-01-01T00:00:00.000Z",
            contenu: "<p>Ambition</p>",
            auteur_creation_id: AUTEUR_ID,
            auteur_modification_id: MODIFICATEUR_ID,
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
    expect(result.objectifs.notre_ambition).toEqual({
      date_publication: "2025-01-01T00:00:00.000Z",
      contenu: "Ambition",
      auteur: REFERENCE_AUTEUR,
      modifie_par: personReference(MODIFICATEUR_ID),
    });
  });
});
