import { $Enums } from "@prisma/client";
import { ArticleCentreAideRepository } from "@/server/parametrage-centre-aide/domain/ports/ArticleCentreAideRepository";
import { ArticleCentreAide } from "@/server/parametrage-centre-aide/domain/ArticleCentreAide";
import type { Inject } from "@/server/parametrage-centre-aide/module";

export class CreerArticleCentreAideUseCase {
  private articleCentreAideRepository: ArticleCentreAideRepository;

  constructor({
    articleCentreAideRepository,
  }: Inject<"articleCentreAideRepository">) {
    this.articleCentreAideRepository = articleCentreAideRepository;
  }

  async execute({
    id,
    titre,
    contenu,
    type,
    ordre,
    parentId,
  }: {
    id: string;
    titre: string;
    contenu?: string | null;
    type: $Enums.TypeArticleCentreAide;
    ordre: number;
    parentId?: string | null;
  }) {
    const contenuSanitized = contenu
      ? ArticleCentreAide.sanitizeHtml(contenu)
      : null;

    const article = ArticleCentreAide.creerArticle({
      id,
      titre,
      contenu: contenuSanitized,
      type,
      ordre,
      parentId,
    });

    return this.articleCentreAideRepository.creer(article);
  }
}
