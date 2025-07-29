export const typesAte = [
  "ate",
  "hors_ate_centralise",
  "hors_ate_deconcentre",
] as const;
export type TypeAte = (typeof typesAte)[number] | null;

export const typesStatut = [
  "BROUILLON",
  "PUBLIE",
  "ARCHIVE",
  "SUPPRIME",
] as const;
export type TypeStatut = (typeof typesStatut)[number];

export type ChantierSynthetise = {
  id: string;
  nom: string;
  estTerritorialisé: boolean;
  périmètreIds: string[];
  statut: TypeStatut;
  ate: TypeAte;
  territoiresApplicables: string[];
};
