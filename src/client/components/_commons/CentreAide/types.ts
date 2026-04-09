import { ArticleCentreAideContrat } from "@/server/parametrage-centre-aide/app/contrats/ArticleCentreAideContrat";

export type NoeudArbre = ArticleCentreAideContrat & {
  enfants: NoeudArbre[];
};

export const aDesModificationsNonPubliees = (article: {
  estPublie: boolean;
  titreBrouillon: string | null;
  titre: string;
  contenuBrouillon: string | null;
  contenu: string | null;
  titreAfficheBrouillon: string | null;
  titreAffiche: string | null;
}): boolean =>
  article.estPublie &&
  (article.titreBrouillon !== article.titre ||
    article.contenuBrouillon !== article.contenu ||
    article.titreAfficheBrouillon !== article.titreAffiche);

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

export const filtrerArbreParRecherche = (
  noeuds: NoeudArbre[],
  recherche: string,
): NoeudArbre[] => {
  if (!recherche.trim()) return noeuds;

  const rechercheLower = recherche.toLowerCase();

  const filtrer = (noeuds: NoeudArbre[]): NoeudArbre[] => {
    return noeuds
      .map((noeud) => {
        const enfantsFiltres = filtrer(noeud.enfants);
        const correspondAuNom = noeud.titre
          .toLowerCase()
          .includes(rechercheLower);

        if (correspondAuNom || enfantsFiltres.length > 0) {
          return { ...noeud, enfants: enfantsFiltres };
        }
        return null;
      })
      .filter((noeud): noeud is NoeudArbre => noeud !== null);
  };

  return filtrer(noeuds);
};
