import { ArticleCentreAideRepository } from "@/server/parametrage-centre-aide/domain/ports/ArticleCentreAideRepository";
import {
  pagesVisibles,
  urlPageCentreAide,
} from "@/server/parametrage-centre-aide/domain/pagesVisibles";
import {
  convertirHtmlEnMarkdown,
  extraireIntertitres,
} from "@/server/parametrage-centre-aide/app/convertirHtmlEnMarkdown";

export type EntreeSommaireCentreAide = {
  id: string;
  titre: string;
  chemin: string[];
  intertitres: string[];
  url: string;
};

/**
 * Lu à chaque appel, sans cache : une page republiée est prise en compte
 * immédiatement. Une trentaine de lignes, la lecture ne coûte rien.
 */
export class GetSommaireCentreAideQuery {
  private articleCentreAideRepository: ArticleCentreAideRepository;

  constructor({
    articleCentreAideRepository,
  }: {
    articleCentreAideRepository: ArticleCentreAideRepository;
  }) {
    this.articleCentreAideRepository = articleCentreAideRepository;
  }

  async execute(): Promise<EntreeSommaireCentreAide[]> {
    const pages = pagesVisibles(
      await this.articleCentreAideRepository.lister(),
    );

    return pages.map((page) => ({
      id: page.id,
      titre: page.titre,
      chemin: page.chemin,
      intertitres: extraireIntertitres(convertirHtmlEnMarkdown(page.contenu)),
      url: urlPageCentreAide(page.id),
    }));
  }
}
