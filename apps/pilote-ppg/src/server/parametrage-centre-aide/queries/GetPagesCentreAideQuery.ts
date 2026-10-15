import { ArticleCentreAideRepository } from "@/server/parametrage-centre-aide/domain/ports/ArticleCentreAideRepository";
import {
  pagesVisibles,
  urlPageCentreAide,
} from "@/server/parametrage-centre-aide/domain/pagesVisibles";
import { convertirHtmlEnMarkdown } from "@/server/parametrage-centre-aide/app/convertirHtmlEnMarkdown";

export type PageCentreAide = {
  id: string;
  titre: string;
  chemin: string[];
  url: string;
  contenuMarkdown: string;
};

/**
 * Un id inconnu ou invisible est ignoré sans erreur : l'appelant compare ce
 * qu'il a demandé à ce qu'il reçoit.
 */
export class GetPagesCentreAideQuery {
  private articleCentreAideRepository: ArticleCentreAideRepository;

  constructor({
    articleCentreAideRepository,
  }: {
    articleCentreAideRepository: ArticleCentreAideRepository;
  }) {
    this.articleCentreAideRepository = articleCentreAideRepository;
  }

  async execute({ ids }: { ids: string[] }): Promise<PageCentreAide[]> {
    const pages = new Map(
      pagesVisibles(await this.articleCentreAideRepository.lister()).map(
        (page) => [page.id, page],
      ),
    );

    return ids.flatMap((id) => {
      const page = pages.get(id);
      return page
        ? [
            {
              id: page.id,
              titre: page.titre,
              chemin: page.chemin,
              url: urlPageCentreAide(page.id),
              contenuMarkdown: convertirHtmlEnMarkdown(page.contenu),
            },
          ]
        : [];
    });
  }
}
