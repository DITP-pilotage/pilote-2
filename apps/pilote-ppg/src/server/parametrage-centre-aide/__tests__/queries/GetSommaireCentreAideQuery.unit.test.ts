import { mock } from "vitest-mock-extended";
import { ArticleCentreAide } from "@/server/parametrage-centre-aide/domain/ArticleCentreAide";
import { ArticleCentreAideRepository } from "@/server/parametrage-centre-aide/domain/ports/ArticleCentreAideRepository";
import { GetSommaireCentreAideQuery } from "@/server/parametrage-centre-aide/queries/GetSommaireCentreAideQuery";

const GROUPE = "0192a000-0000-7000-8000-000000000011";
const PAGE = "0192a000-0000-7000-8000-000000000012";

describe("GetSommaireCentreAideQuery", () => {
  it("renvoie chaque page visible avec son chemin, ses intertitres et son url", async () => {
    // Given
    const articleCentreAideRepository = mock<ArticleCentreAideRepository>();
    articleCentreAideRepository.lister.mockResolvedValue([
      ArticleCentreAide.creerArticle({
        id: GROUPE,
        titre: "Notions clés",
        type: "GROUPE",
        ordre: 0,
        estPublie: true,
      }),
      ArticleCentreAide.creerArticle({
        id: PAGE,
        titre: "Le taux d'avancement",
        type: "PAGE",
        ordre: 0,
        parentId: GROUPE,
        estPublie: true,
        contenu:
          "<p>Définition</p><h2>Pour un indicateur</h2><p>…</p><h3>Bornes</h3>",
      }),
    ]);
    const query = new GetSommaireCentreAideQuery({
      articleCentreAideRepository,
    });

    // When
    const sommaire = await query.execute();

    // Then
    expect(sommaire).toEqual([
      {
        id: PAGE,
        titre: "Le taux d'avancement",
        chemin: ["Notions clés"],
        intertitres: ["Pour un indicateur", "Bornes"],
        url: `/centre-aide-pilote?article=${PAGE}`,
      },
    ]);
  });
});
