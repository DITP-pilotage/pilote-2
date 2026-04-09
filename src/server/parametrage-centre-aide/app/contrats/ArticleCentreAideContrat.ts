import { $Enums } from "@prisma/client";
import { ArticleCentreAide } from "@/server/parametrage-centre-aide/domain/ArticleCentreAide";

export type ArticleCentreAideContrat = {
  id: string;
  titre: string;
  contenu: string | null;
  titreBrouillon: string | null;
  contenuBrouillon: string | null;
  titreAffiche: string | null;
  titreAfficheBrouillon: string | null;
  type: $Enums.TypeArticleCentreAide;
  ordre: number;
  parentId: string | null;
  estPublie: boolean;
  estMasque: boolean;
};

export const presenterEnArticleCentreAideContrat = (
  article: ArticleCentreAide,
): ArticleCentreAideContrat => {
  return {
    id: article.id,
    titre: article.titre,
    contenu: article.contenu,
    titreBrouillon: article.titreBrouillon,
    contenuBrouillon: article.contenuBrouillon,
    titreAffiche: article.titreAffiche,
    titreAfficheBrouillon: article.titreAfficheBrouillon,
    type: article.type,
    ordre: article.ordre,
    parentId: article.parentId,
    estPublie: article.estPublie,
    estMasque: article.estMasque,
  };
};

export const presenterEnListeArticleCentreAideContrat = (
  articles: ArticleCentreAide[],
): ArticleCentreAideContrat[] => {
  return articles.map(presenterEnArticleCentreAideContrat);
};
