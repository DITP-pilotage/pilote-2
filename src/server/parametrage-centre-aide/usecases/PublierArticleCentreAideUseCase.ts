import { ArticleCentreAideRepository } from "@/server/parametrage-centre-aide/domain/ports/ArticleCentreAideRepository";
import { ArticleCentreAide } from "@/server/parametrage-centre-aide/domain/ArticleCentreAide";
import type { Inject } from "@/server/parametrage-centre-aide/module";

export class PublierArticleCentreAideUseCase {
  private articleCentreAideRepository: ArticleCentreAideRepository;

  constructor({
    articleCentreAideRepository,
  }: Inject<"articleCentreAideRepository">) {
    this.articleCentreAideRepository = articleCentreAideRepository;
  }

  async execute({ id }: { id: string }) {
    const existant = await this.articleCentreAideRepository.recupererParId(id);
    if (!existant) throw new Error(`Article ${id} introuvable`);

    const articlePublie = ArticleCentreAide.creerArticle({
      id: existant.id,
      titre: existant.titreBrouillon ?? existant.titre,
      contenu: existant.contenuBrouillon,
      titreBrouillon: existant.titreBrouillon,
      contenuBrouillon: existant.contenuBrouillon,
      type: existant.type,
      ordre: existant.ordre,
      parentId: existant.parentId,
      estPublie: true,
      estMasque: existant.estMasque,
      dateCreation: existant.dateCreation,
    });

    return this.articleCentreAideRepository.modifier(articlePublie);
  }
}
