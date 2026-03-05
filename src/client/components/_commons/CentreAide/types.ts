import { ArticleCentreAideContrat } from "@/server/parametrage-centre-aide/app/contrats/ArticleCentreAideContrat";

export type NoeudArbre = ArticleCentreAideContrat & {
  enfants: NoeudArbre[];
};

export const construireArbre = (
  articles: ArticleCentreAideContrat[],
): NoeudArbre[] => {
  const map = new Map<string, NoeudArbre>();

  for (const article of articles) {
    map.set(article.id, { ...article, enfants: [] });
  }

  const racines: NoeudArbre[] = [];

  for (const article of articles) {
    const noeud = map.get(article.id)!;
    if (article.parentId) {
      const parent = map.get(article.parentId);
      if (parent) {
        parent.enfants.push(noeud);
      }
    } else {
      racines.push(noeud);
    }
  }

  return racines;
};
