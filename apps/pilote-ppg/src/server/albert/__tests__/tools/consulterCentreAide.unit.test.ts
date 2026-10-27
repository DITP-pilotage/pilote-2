import { afterEach, describe, expect, test, vi } from "vitest";
import { mock } from "vitest-mock-extended";
import { Albert } from "@/server/albert/Albert";
import { createConsulterCentreAideTool } from "@/server/albert/tools/consulterCentreAide";
import type {
  EntreeSommaireCentreAide,
  GetSommaireCentreAideQuery,
} from "@/server/parametrage-centre-aide/queries/GetSommaireCentreAideQuery";
import type {
  GetPagesCentreAideQuery,
  PageCentreAide,
} from "@/server/parametrage-centre-aide/queries/GetPagesCentreAideQuery";

const entree = (id: string, titre: string): EntreeSommaireCentreAide => ({
  id,
  titre,
  chemin: ["Notions clés"],
  intertitres: [],
  url: `/centre-aide-pilote?article=${id}`,
});

const pageCentreAide = (id: string, titre: string): PageCentreAide => ({
  id,
  titre,
  chemin: ["Notions clés"],
  url: `/centre-aide-pilote?article=${id}`,
  contenuMarkdown: `Contenu de ${titre}`,
});

const buildTool = ({
  sommaire,
  pages,
}: {
  sommaire: EntreeSommaireCentreAide[];
  pages: PageCentreAide[];
}) => {
  const getSommaireCentreAideQuery = mock<GetSommaireCentreAideQuery>({
    execute: async () => sommaire,
  });
  const getPagesCentreAideQuery = mock<GetPagesCentreAideQuery>();
  getPagesCentreAideQuery.execute.mockImplementation(async ({ ids }) =>
    pages.filter((page) => ids.includes(page.id)),
  );
  const tool = createConsulterCentreAideTool({
    getSommaireCentreAideQuery,
    getPagesCentreAideQuery,
  })();
  return { tool, getPagesCentreAideQuery };
};

const executeTool = (
  tool: ReturnType<ReturnType<typeof createConsulterCentreAideTool>>,
  question: string,
) =>
  tool.execute!(
    { question },
    { toolCallId: "test", messages: [], abortSignal: undefined, context: {} },
  );

const NON_TROUVE = {
  trouve: false,
  reponse: "",
  sources: [],
};

describe("createConsulterCentreAideTool execute", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("répond avec les pages réellement utilisées", async () => {
    // Given
    vi.spyOn(Albert, "generateStructuredOutput")
      .mockResolvedValueOnce({ ids: ["taux", "meteo"], reasoning: "test" })
      .mockResolvedValueOnce({
        trouve: true,
        reponse: "TA = (VA − VI) / (VC − VI)",
        sourcesIds: ["taux"],
      });
    const { tool } = buildTool({
      sommaire: [entree("taux", "Le taux"), entree("meteo", "La météo")],
      pages: [
        pageCentreAide("taux", "Le taux"),
        pageCentreAide("meteo", "La météo"),
      ],
    });

    // When
    const result = await executeTool(
      tool,
      "comment est calculé le taux d'avancement",
    );

    // Then
    expect(result).toEqual({
      trouve: true,
      reponse: "TA = (VA − VI) / (VC − VI)",
      sources: [
        {
          id: "taux",
          titre: "Le taux",
          chemin: ["Notions clés"],
          url: "/centre-aide-pilote?article=taux",
        },
      ],
    });
  });

  test("ne lit que les pages du sommaire, et au plus trois", async () => {
    // Given
    vi.spyOn(Albert, "generateStructuredOutput")
      .mockResolvedValueOnce({
        ids: ["inventee", "p1", "p2", "p3", "p4"],
        reasoning: "test",
      })
      .mockResolvedValueOnce({ trouve: false, reponse: "", sourcesIds: [] });
    const { tool, getPagesCentreAideQuery } = buildTool({
      sommaire: ["p1", "p2", "p3", "p4"].map((id) => entree(id, id)),
      pages: [],
    });

    // When
    await executeTool(tool, "question");

    // Then
    expect(getPagesCentreAideQuery.execute).toHaveBeenCalledWith({
      ids: ["p1", "p2", "p3"],
    });
  });

  test("ne consulte pas le LLM quand le centre d'aide est vide", async () => {
    // Given
    const appelLLM = vi.spyOn(Albert, "generateStructuredOutput");
    const { tool } = buildTool({ sommaire: [], pages: [] });

    // When
    const result = await executeTool(tool, "question");

    // Then
    expect(result).toEqual(NON_TROUVE);
    expect(appelLLM).not.toHaveBeenCalled();
  });

  test("ne rédige pas de réponse quand aucune page n'est sélectionnée", async () => {
    // Given
    const appelLLM = vi
      .spyOn(Albert, "generateStructuredOutput")
      .mockResolvedValueOnce({ ids: [], reasoning: "hors sujet" });
    const { tool } = buildTool({
      sommaire: [entree("taux", "Le taux")],
      pages: [],
    });

    // When
    const result = await executeTool(tool, "alertes par mail");

    // Then
    expect(result).toEqual(NON_TROUVE);
    expect(appelLLM).toHaveBeenCalledTimes(1);
  });

  test("bascule en non trouvé quand aucune source citée n'a été lue", async () => {
    // Given
    vi.spyOn(Albert, "generateStructuredOutput")
      .mockResolvedValueOnce({ ids: ["taux"], reasoning: "test" })
      .mockResolvedValueOnce({
        trouve: true,
        reponse: "Réponse sans source",
        sourcesIds: ["inventee"],
      });
    const { tool } = buildTool({
      sommaire: [entree("taux", "Le taux")],
      pages: [pageCentreAide("taux", "Le taux")],
    });

    // When
    const result = await executeTool(tool, "question");

    // Then
    expect(result).toEqual(NON_TROUVE);
  });

  test("bascule en non trouvé quand le sous-agent ne trouve pas", async () => {
    // Given
    vi.spyOn(Albert, "generateStructuredOutput")
      .mockResolvedValueOnce({ ids: ["taux"], reasoning: "test" })
      .mockResolvedValueOnce({
        trouve: false,
        reponse: "Une tentative",
        sourcesIds: ["taux"],
      });
    const { tool } = buildTool({
      sommaire: [entree("taux", "Le taux")],
      pages: [pageCentreAide("taux", "Le taux")],
    });

    // When
    const result = await executeTool(tool, "question");

    // Then
    expect(result).toEqual(NON_TROUVE);
  });

  test("ne liste qu'une fois une source citée deux fois", async () => {
    // Given
    vi.spyOn(Albert, "generateStructuredOutput")
      .mockResolvedValueOnce({ ids: ["taux"], reasoning: "test" })
      .mockResolvedValueOnce({
        trouve: true,
        reponse: "Réponse",
        sourcesIds: ["taux", "taux"],
      });
    const { tool } = buildTool({
      sommaire: [entree("taux", "Le taux")],
      pages: [pageCentreAide("taux", "Le taux")],
    });

    // When
    const result = await executeTool(tool, "question");

    // Then
    expect(result).toEqual({
      trouve: true,
      reponse: "Réponse",
      sources: [
        {
          id: "taux",
          titre: "Le taux",
          chemin: ["Notions clés"],
          url: "/centre-aide-pilote?article=taux",
        },
      ],
    });
  });
});
