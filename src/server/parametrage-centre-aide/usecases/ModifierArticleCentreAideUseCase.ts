import { $Enums } from "@prisma/client";
import { ArticleCentreAide } from "@/server/parametrage-centre-aide/domain/ArticleCentreAide";
import { ArticleCentreAideRepository } from "@/server/parametrage-centre-aide/domain/ports/ArticleCentreAideRepository";

type Dependencies = {
  articleCentreAideRepository: ArticleCentreAideRepository;
};

export class ModifierArticleCentreAideUseCase {
  constructor(private readonly deps: Dependencies) {}

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

    return this.deps.articleCentreAideRepository.modifier(article);
  }
}
