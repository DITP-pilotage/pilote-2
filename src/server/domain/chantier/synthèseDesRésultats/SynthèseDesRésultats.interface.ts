import { $Enums } from "@prisma/client";
import { Météo } from "@/server/domain/météo/Météo.interface";

type SynthèseDesRésultats = {
  id: string;
  contenu: string;
  date: string;
  auteur: string;
  météo: Météo;
} | null;

export type SynthèseDesRésultatsV2 = {
  chantierId: string;
  territoireCode: string;
  id: string;
  contenu: string;
  meteo: Météo;
  auteurCreationId: string;
  dateCreation: string;
  auteurModificationId: string;
  dateModification: string;
  statut: $Enums.statut_publication;
};

export type SyntheseDesResultatsAvecNomsAuteurs = SynthèseDesRésultatsV2 & {
  auteurCreationNom: string;
  auteurModificationNom: string;
  dateDernierBrouillon: string | null;
};

export default SynthèseDesRésultats;
