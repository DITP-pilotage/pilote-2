import { MockProxy, mock } from "vitest-mock-extended";
import { ArticleCentreAideRepository } from "@/server/parametrage-centre-aide/domain/ports/ArticleCentreAideRepository";
import { BasculerVisibiliteArticleCentreAideUseCase } from "@/server/parametrage-centre-aide/usecases/BasculerVisibiliteArticleCentreAideUseCase";
import { ArticleCentreAide } from "@/server/parametrage-centre-aide/domain/ArticleCentreAide";

describe("BasculerVisibiliteArticleCentreAideUseCase", () => {
  let basculerVisibiliteUseCase: BasculerVisibiliteArticleCentreAideUseCase;
  let articleCentreAideRepository: MockProxy<ArticleCentreAideRepository>;

  beforeEach(() => {
    articleCentreAideRepository = mock<ArticleCentreAideRepository>();
    basculerVisibiliteUseCase = new BasculerVisibiliteArticleCentreAideUseCase({
      articleCentreAideRepository,
    });
  });

  it("Doit masquer un article visible", async () => {
    // Given - article non masqué
    const article = ArticleCentreAide.creerArticle({
      id: "550e8400-e29b-41d4-a716-446655440000",
      titre: "Mon titre",
      contenu: "Mon contenu",
      type: "PAGE",
      ordre: 1,
      estPublie: true,
      estMasque: false,
    });
    articleCentreAideRepository.recupererParId.mockResolvedValue(article);

    // When
    await basculerVisibiliteUseCase.execute({
      id: "550e8400-e29b-41d4-a716-446655440000",
    });

    // Then
    expect(articleCentreAideRepository.modifier).toHaveBeenCalledWith(
      expect.objectContaining({
        estMasque: true,
        estPublie: true,
      }),
    );
  });

  it("Doit rendre visible un article masqué", async () => {
    // Given - article masqué
    const article = ArticleCentreAide.creerArticle({
      id: "550e8400-e29b-41d4-a716-446655440000",
      titre: "Mon titre",
      contenu: "Mon contenu",
      type: "PAGE",
      ordre: 1,
      estPublie: true,
      estMasque: true,
    });
    articleCentreAideRepository.recupererParId.mockResolvedValue(article);

    // When
    await basculerVisibiliteUseCase.execute({
      id: "550e8400-e29b-41d4-a716-446655440000",
    });

    // Then
    expect(articleCentreAideRepository.modifier).toHaveBeenCalledWith(
      expect.objectContaining({
        estMasque: false,
        estPublie: true,
      }),
    );
  });

  it("Doit lancer une erreur si l'article n'existe pas", async () => {
    // Given
    articleCentreAideRepository.recupererParId.mockResolvedValue(null);

    // When / Then
    await expect(
      basculerVisibiliteUseCase.execute({
        id: "550e8400-e29b-41d4-a716-446655440000",
      }),
    ).rejects.toThrow(
      "Article 550e8400-e29b-41d4-a716-446655440000 introuvable",
    );
  });
});
