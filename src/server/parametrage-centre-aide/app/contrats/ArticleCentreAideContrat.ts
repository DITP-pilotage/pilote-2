import { $Enums } from "@prisma/client";
import { ArticleCentreAide } from "@/server/parametrage-centre-aide/domain/ArticleCentreAide";

export type ArticleCentreAideContrat = {
  id: string;
  titre: string;
  contenu: string | null;
  type: $Enums.TypeArticleCentreAide;
  ordre: number;
  parentId: string | null;
};

export const presenterEnArticleCentreAideContrat = (
  article: ArticleCentreAide,
): ArticleCentreAideContrat => {
  return {
    id: article.id,
    titre: article.titre,
    contenu: article.contenu,
    type: article.type,
    ordre: article.ordre,
    parentId: article.parentId,
  };
};

export const presenterEnListeArticleCentreAideContrat = (
  articles: ArticleCentreAide[],
): ArticleCentreAideContrat[] => {
  return articles.map(presenterEnArticleCentreAideContrat);
};
