import { typesObjectif as typesObjectifChantier } from "@/server/domain/chantier/objectif/Objectif.interface";

export const typesObjectif = [...typesObjectifChantier] as const;
export type TypeObjectif = (typeof typesObjectif)[number];

export const libellésTypesObjectif: Record<TypeObjectif, string> = {
  notreAmbition: "Notre ambition",
  dejaFait: "Ce qui a déjà été fait",
  aFaire: "Ce qui reste à faire",
};

export const complementsConsigneGeneriqueObjectif: Record<
  TypeObjectif,
  string
> = {
  notreAmbition: "à l'ambition du chantier (objectifs)",
  dejaFait: "à ce qui a déjà été fait (objectifs)",
  aFaire: "à ce qui reste à faire (objectifs)",
};

export const consignesDÉcritureObjectif: Record<TypeObjectif, string> = {
  notreAmbition:
    "Rappelez l'ambition politique de votre chantier à horizon 2026 : quels sont les objectifs ? Pourquoi les indicateurs choisis pour mesurer son avancement sont-ils importants ? Quels sont les leviers pour agir au niveau central et déconcentré ?",
  dejaFait:
    "Quelles ont été les principales avancées au niveau national et au niveau déconcentré ?",
  aFaire:
    "Quels sont les objectifs sur lesquels insister ? Quelles sont les principales actions envisagées ?",
};
