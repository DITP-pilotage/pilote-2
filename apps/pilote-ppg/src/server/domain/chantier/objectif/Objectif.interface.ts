import { $Enums } from "@prisma/client";

export const typesObjectif = ["notreAmbition", "dejaFait", "aFaire"] as const;
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
  id: string;
  chantierId: string;
  type: TypeObjectif;
  contenu: string;
  statut: $Enums.statut_publication;
  auteurCreationId: string;
  dateCreation: string;
  auteurModificationId: string;
  dateModification: string;
};

export type ObjectifV2AvecNomAuteur = ObjectifV2 & {
  auteurCreationNom: string;
  auteurCreationService: string | null;
  auteurCreationFonction: string | null;
  auteurModificationNom: string;
  auteurModificationService: string | null;
  auteurModificationFonction: string | null;
};

export default Objectif;
