export const typesObjectif = ['notreAmbition', 'déjàFait', 'àFaire'] as const;
export type TypeObjectif = typeof typesObjectif[number];

type Objectif = {
  id: string
  contenu: string
  date: string
  auteur: string
  type: TypeObjectif
} | null;

export type Objectifs = Record<TypeObjectif, Objectif>;

export default Objectif;
