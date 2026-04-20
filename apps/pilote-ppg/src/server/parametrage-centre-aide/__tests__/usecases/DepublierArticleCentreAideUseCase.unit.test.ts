import { MockProxy, mock } from "vitest-mock-extended";
import { ArticleCentreAideRepository } from "@/server/parametrage-centre-aide/domain/ports/ArticleCentreAideRepository";
import { DepublierArticleCentreAideUseCase } from "@/server/parametrage-centre-aide/usecases/DepublierArticleCentreAideUseCase";
import { ArticleCentreAide } from "@/server/parametrage-centre-aide/domain/ArticleCentreAide";

describe("DepublierArticleCentreAideUseCase", () => {
  let depublierArticleCentreAideUseCase: DepublierArticleCentreAideUseCase;
  let articleCentreAideRepository: MockProxy<ArticleCentreAideRepository>;

  beforeEach(() => {
    articleCentreAideRepository = mock<ArticleCentreAideRepository>();
    depublierArticleCentreAideUseCase = new DepublierArticleCentreAideUseCase({
      articleCentreAideRepository,
    });
  });

  it("Doit dépublier l'article en passant estPublie à false", async () => {
    // Given
    const article = ArticleCentreAide.creerArticle({
      id: "550e8400-e29b-41d4-a716-446655440000",
      titre: "Mon titre",
      contenu: "Mon contenu",
      titreBrouillon: "Mon titre",
      contenuBrouillon: "Mon contenu",
      type: "PAGE",
      ordre: 1,
      estPublie: true,
    });
    articleCentreAideRepository.recupererParId.mockResolvedValue(article);

    // When
    await depublierArticleCentreAideUseCase.execute({
      id: "550e8400-e29b-41d4-a716-446655440000",
    });

    // Then
    expect(articleCentreAideRepository.modifier).toHaveBeenCalledWith(
      expect.objectContaining({
        titre: "Mon titre",
        contenu: "Mon contenu",
        estPublie: false,
      }),
    );
  });

  it("Doit conserver l'état masqué lors de la dépublication", async () => {
    // Given - article publié et masqué
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
    await depublierArticleCentreAideUseCase.execute({
      id: "550e8400-e29b-41d4-a716-446655440000",
    });

    // Then
    expect(articleCentreAideRepository.modifier).toHaveBeenCalledWith(
      expect.objectContaining({
        estPublie: false,
        estMasque: true,
      }),
    );
  });

  it("Doit lancer une erreur si l'article n'existe pas", async () => {
    // Given
    articleCentreAideRepository.recupererParId.mockResolvedValue(null);

    // When / Then
    await expect(
      depublierArticleCentreAideUseCase.execute({
        id: "550e8400-e29b-41d4-a716-446655440000",
      }),
    ).rejects.toThrow(
      "Article 550e8400-e29b-41d4-a716-446655440000 introuvable",
    );
  });
});
