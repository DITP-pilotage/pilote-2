import { MockProxy, mock } from "vitest-mock-extended";
import { ArticleCentreAideRepository } from "@/server/parametrage-centre-aide/domain/ports/ArticleCentreAideRepository";
import { DeplacerArticleCentreAideUseCase } from "@/server/parametrage-centre-aide/usecases/DeplacerArticleCentreAideUseCase";
import { ArticleCentreAide } from "@/server/parametrage-centre-aide/domain/ArticleCentreAide";
import { Transaction } from "@/server/db/Transaction";

const creerArticle = (
  id: string,
  ordre: number,
  parentId: string | null = null,
  type: "GROUPE" | "PAGE" = "PAGE",
) =>
  ArticleCentreAide.creerArticle({
    id,
    titre: id,
    type,
    ordre,
    parentId,
  });

describe("DeplacerArticleCentreAideUseCase", () => {
  let deplacerArticleCentreAideUseCase: DeplacerArticleCentreAideUseCase;
  let articleCentreAideRepository: MockProxy<ArticleCentreAideRepository>;
  let transaction: MockProxy<Transaction>;

  beforeEach(() => {
    articleCentreAideRepository = mock<ArticleCentreAideRepository>();
    transaction = mock<Transaction>();
    transaction.run.mockImplementation(async (callback) => callback());
    deplacerArticleCentreAideUseCase = new DeplacerArticleCentreAideUseCase({
      articleCentreAideRepository,
      transaction,
    });
  });

  it("Doit réindexer la fratrie quand l'article change de position au même niveau", async () => {
    // Given
    const a = creerArticle("a", 0);
    const b = creerArticle("b", 1);
    const c = creerArticle("c", 2);
    articleCentreAideRepository.recupererParId.mockResolvedValue(c);
    articleCentreAideRepository.listerParParent.mockResolvedValue([a, b, c]);

    // When
    await deplacerArticleCentreAideUseCase.execute({
      id: "c",
      parentId: null,
      index: 0,
    });

    // Then
    expect(
      articleCentreAideRepository.modifierOrdreEtParent,
    ).toHaveBeenCalledWith("c", 0, null);
    expect(
      articleCentreAideRepository.modifierOrdreEtParent,
    ).toHaveBeenCalledWith("a", 1, null);
    expect(
      articleCentreAideRepository.modifierOrdreEtParent,
    ).toHaveBeenCalledWith("b", 2, null);
  });

  it("Doit réindexer les deux fratries quand l'article change de parent", async () => {
    // Given
    const groupe = creerArticle("groupe", 0, null, "GROUPE");
    const page = creerArticle("page", 1);
    const enfant = creerArticle("enfant", 0, "groupe");
    articleCentreAideRepository.recupererParId.mockImplementation(async (id) =>
      id === "page" ? page : id === "groupe" ? groupe : null,
    );
    articleCentreAideRepository.listerParParent.mockImplementation(
      async (parentId) => (parentId === null ? [groupe, page] : [enfant]),
    );

    // When
    await deplacerArticleCentreAideUseCase.execute({
      id: "page",
      parentId: "groupe",
      index: 0,
    });

    // Then
    expect(
      articleCentreAideRepository.modifierOrdreEtParent,
    ).toHaveBeenCalledWith("page", 0, "groupe");
    expect(
      articleCentreAideRepository.modifierOrdreEtParent,
    ).toHaveBeenCalledWith("enfant", 1, "groupe");
    expect(
      articleCentreAideRepository.modifierOrdreEtParent,
    ).toHaveBeenCalledWith("groupe", 0, null);
  });

  it("Doit refuser de déplacer un article sous l'un de ses descendants", async () => {
    // Given
    const parent = creerArticle("parent", 0, null, "GROUPE");
    const enfant = creerArticle("enfant", 0, "parent", "GROUPE");
    articleCentreAideRepository.recupererParId.mockImplementation(async (id) =>
      id === "parent" ? parent : id === "enfant" ? enfant : null,
    );

    // When / Then
    await expect(
      deplacerArticleCentreAideUseCase.execute({
        id: "parent",
        parentId: "enfant",
        index: 0,
      }),
    ).rejects.toThrow("Un article ne peut pas être déplacé sous lui-même");
    expect(
      articleCentreAideRepository.modifierOrdreEtParent,
    ).not.toHaveBeenCalled();
  });

  it("Doit remonter l'erreur quand l'article est introuvable", async () => {
    // Given
    articleCentreAideRepository.recupererParId.mockResolvedValue(null);

    // When / Then
    await expect(
      deplacerArticleCentreAideUseCase.execute({
        id: "inconnu",
        parentId: null,
        index: 0,
      }),
    ).rejects.toThrow("Article introuvable");
  });
});
