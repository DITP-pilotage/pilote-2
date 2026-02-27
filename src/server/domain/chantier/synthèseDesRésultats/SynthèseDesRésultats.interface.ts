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
  auteur_id: string;
  météo: Météo;
  date: Date;
};

export default SynthèseDesRésultats;
