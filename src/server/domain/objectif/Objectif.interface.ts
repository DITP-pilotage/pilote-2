export const typesObjectif = ['notreAmbition', 'déjàFait', 'àFaire'] as const;
export type TypeObjectif = typeof typesObjectif[number];

type Objectif = {
  contenu: string
  date: string
  auteur: string
};

export type Objectifs = Record<TypeObjectif, Objectif | null>;

export default Objectif;
