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
  météo: Météo;
  auteur_creation_id: string;
  date_creation: string;
  auteur_modification_id: string;
  date_modification: string;
};

export default SynthèseDesRésultats;
