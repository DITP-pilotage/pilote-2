export const typesObjectif = ['notreAmbition', 'déjàFait', 'àFaire'] as const;
export type TypeObjectif = typeof typesObjectif[number];

type Objectif = {
  contenu: string
  date: string
  auteur: string
} | null;

export type Objectifs = Record<TypeObjectif, Objectif>;

export default Objectif;
