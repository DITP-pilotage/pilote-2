// Le point qui porte une valeur : un individu et une combinaison de modalités
// (la combinaison vide pour un indicateur sans axe). Concept de domaine, pas
// de table.
export type Cellule = {
  individuId: string
  combinaisonId: string
}

// Clé d'une cellule pour les caches et les index en mémoire. L'individu seul ne
// suffit pas : un même individu peut être calculé pour plusieurs combinaisons
// dans une même lecture (ex. Orange, SFR et « Tous »).
export const cleCellule = ({ individuId, combinaisonId }: Cellule): string =>
  `${individuId}~${combinaisonId}`
