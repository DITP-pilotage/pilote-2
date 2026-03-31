import { $Enums } from "@prisma/client";
import { Meteo } from "@/server/domain/météo/Météo.interface";

type SynthèseDesRésultats = {
  id: string;
  contenu: string;
  contenuHtml?: string | null;
  date: string;
  auteur: string;
  météo: Meteo;
} | null;

export type SyntheseDesResultatsV2 = {
  chantierId: string;
  territoireCode: string;
  id: string;
  contenu: string;
  contenuHtml?: string | null;
  meteo: Meteo;
  auteurCreationId: string;
  dateCreation: string;
  auteurModificationId: string;
  dateModification: string;
  statut: $Enums.statut_publication;
};

export type SyntheseDesResultatsAvecNomsAuteurs = SyntheseDesResultatsV2 & {
  auteurCreationNom: string;
  auteurModificationNom: string;
};

export default SynthèseDesRésultats;
