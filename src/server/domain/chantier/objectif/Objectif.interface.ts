export const typesObjectifChantier = ['notreAmbition', 'déjàFait', 'àFaire'] as const;
export type TypeObjectifChantier = typeof typesObjectifChantier[number];

type Objectif = {
  id: string
  contenu: string
  date: string
  auteur: string
  type: TypeObjectifChantier
} | null;

export type Objectifs = Record<TypeObjectifChantier, Objectif>;

export default Objectif;
