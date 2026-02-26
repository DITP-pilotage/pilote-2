export const typesObjectif = ["notreAmbition", "déjàFait", "àFaire"] as const;
export type TypeObjectif = (typeof typesObjectif)[number];

type Objectif = {
  id: string;
  contenu: string;
  date: string;
  auteur: string;
  type: TypeObjectif;
} | null;

export type Objectifs = Record<TypeObjectif, Objectif>;

export type ObjectifV2 = {
  chantierId: string;
  id: string;
  contenu: string;
  type: TypeObjectif;
  auteur_id: string;
  date: Date;
};

export default Objectif;
