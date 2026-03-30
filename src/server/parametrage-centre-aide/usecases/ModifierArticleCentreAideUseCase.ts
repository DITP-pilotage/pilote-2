import { $Enums } from "@prisma/client";
import { ArticleCentreAide } from "@/server/parametrage-centre-aide/domain/ArticleCentreAide";
import { ArticleCentreAideRepository } from "@/server/parametrage-centre-aide/domain/ports/ArticleCentreAideRepository";
import type { Inject } from "@/server/parametrage-centre-aide/module";

export class ModifierArticleCentreAideUseCase {
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
    contenuPublie,
    titrePublie,
    estPublie,
    estMasque,
  }: {
    id: string;
    titre: string;
    contenu?: string | null;
    type: $Enums.TypeArticleCentreAide;
    ordre: number;
    parentId?: string | null;
    contenuPublie?: string | null;
    titrePublie?: string | null;
    estPublie?: boolean;
    estMasque?: boolean;
  }) {
    const contenuSanitized = contenu
      ? ArticleCentreAide.sanitizeHtml(contenu)
      : null;

    const article = ArticleCentreAide.creerArticle({
      id,
      titre: titrePublie ?? "",
      contenu: contenuPublie ?? null,
      titreBrouillon: titre,
      contenuBrouillon: contenuSanitized,
      type,
      ordre,
      parentId,
      estPublie: estPublie ?? false,
      estMasque: estMasque ?? false,
    });

    return this.articleCentreAideRepository.modifier(article);
  }
}
