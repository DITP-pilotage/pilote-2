import { ArticleCentreAide } from "@/server/parametrage-centre-aide/domain/ArticleCentreAide";

export type PageVisible = {
  id: string;
  titre: string;
  chemin: string[];
  contenu: string;
};

const titreDe = (article: ArticleCentreAide) =>
  article.titreAffiche || article.titre;

const estVisible = (article: ArticleCentreAide) =>
  article.estPublie && !article.estMasque;

/**
 * Ce qu'un lecteur du centre d'aide voit : la même règle que la page publique,
 * appliquée côté serveur. Un article invisible masque toute sa descendance,
 * et seuls les champs publiés sont lus.
 */
export const pagesVisibles = (
  articles: ArticleCentreAide[],
): PageVisible[] => {
  const enfantsVisibles = (parentId: string | null) =>
    articles
      .filter((article) => article.parentId === parentId && estVisible(article))
      .sort((premier, second) => premier.ordre - second.ordre);

  const parcourir = (
    parentId: string | null,
    chemin: string[],
  ): PageVisible[] =>
    enfantsVisibles(parentId).flatMap((article) => {
      // Un groupe qui a du contenu s'affiche comme une page
      // (`estGroupeSansContenu` dans `PageCentreAidePilote`).
      const page = article.contenu
        ? [
              {
                id: article.id,
                titre: titreDe(article),
                chemin,
                contenu: article.contenu,
              },
            ]
          : [];
      return [...page, ...parcourir(article.id, [...chemin, titreDe(article)])];
    });

  return parcourir(null, []);
};

export const urlPageCentreAide = (id: string) =>
  `/centre-aide-pilote?article=${id}`;
