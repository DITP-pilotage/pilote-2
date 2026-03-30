import { MockProxy, mock } from "vitest-mock-extended";
import { ArticleCentreAideRepository } from "@/server/parametrage-centre-aide/domain/ports/ArticleCentreAideRepository";
import { PublierArticleCentreAideUseCase } from "@/server/parametrage-centre-aide/usecases/PublierArticleCentreAideUseCase";
import { ArticleCentreAide } from "@/server/parametrage-centre-aide/domain/ArticleCentreAide";

describe("PublierArticleCentreAideUseCase", () => {
  let publierArticleCentreAideUseCase: PublierArticleCentreAideUseCase;
  let articleCentreAideRepository: MockProxy<ArticleCentreAideRepository>;

  beforeEach(() => {
    articleCentreAideRepository = mock<ArticleCentreAideRepository>();
    publierArticleCentreAideUseCase = new PublierArticleCentreAideUseCase({
      articleCentreAideRepository,
    });
  });

  it("Doit publier l'article en copiant le brouillon vers le contenu publié", async () => {
    // Given
    const article = ArticleCentreAide.creerArticle({
      id: "550e8400-e29b-41d4-a716-446655440000",
      titre: "Ancien titre",
      contenu: "Ancien contenu",
      titreBrouillon: "Nouveau titre",
      contenuBrouillon: "Nouveau contenu",
      type: "PAGE",
      ordre: 1,
      estPublie: false,
    });
    articleCentreAideRepository.recupererParId.mockResolvedValue(article);

    // When
    await publierArticleCentreAideUseCase.execute({
      id: "550e8400-e29b-41d4-a716-446655440000",
    });

    // Then
    expect(articleCentreAideRepository.modifier).toHaveBeenCalledWith(
      expect.objectContaining({
        titre: "Nouveau titre",
        contenuBrouillon: "Nouveau contenu",
        estPublie: true,
      }),
    );
  });

  it("Doit conserver le titre existant si le brouillon du titre est null", async () => {
    // Given
    const article = ArticleCentreAide.creerArticle({
      id: "550e8400-e29b-41d4-a716-446655440000",
      titre: "Titre existant",
      contenu: "Contenu existant",
      titreBrouillon: null,
      contenuBrouillon: "Nouveau contenu",
      type: "PAGE",
      ordre: 1,
      estPublie: false,
    });
    articleCentreAideRepository.recupererParId.mockResolvedValue(article);

    // When
    await publierArticleCentreAideUseCase.execute({
      id: "550e8400-e29b-41d4-a716-446655440000",
    });

    // Then
    expect(articleCentreAideRepository.modifier).toHaveBeenCalledWith(
      expect.objectContaining({
        titre: "Titre existant",
        estPublie: true,
      }),
    );
  });

  it("Doit lancer une erreur si l'article n'existe pas", async () => {
    // Given
    articleCentreAideRepository.recupererParId.mockResolvedValue(null);

    // When / Then
    await expect(
      publierArticleCentreAideUseCase.execute({
        id: "550e8400-e29b-41d4-a716-446655440000",
      }),
    ).rejects.toThrow(
      "Article 550e8400-e29b-41d4-a716-446655440000 introuvable",
    );
  });
});
