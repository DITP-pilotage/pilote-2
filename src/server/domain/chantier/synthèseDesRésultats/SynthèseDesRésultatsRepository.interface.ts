import { Météo } from "@/server/domain/météo/Météo.interface";
import Chantier from "@/server/domain/chantier/Chantier.interface";
import SynthèseDesRésultats, {
  SynthèseDesRésultatsV2,
} from "./SynthèseDesRésultats.interface";

export default interface SynthèseDesRésultatsRepository {
  save(synthèse: SynthèseDesRésultatsV2): Promise<void>;
  récupérerLaPlusRécente(
    chantierId: string,
    territoireCode: string,
  ): Promise<SynthèseDesRésultats>;
  récupérerHistorique(
    chantierId: string,
    territoireCode: string,
  ): Promise<SynthèseDesRésultats[]>;
  créer(
    chantierId: string,
    territoireCode: string,
    id: string,
    contenu: string,
    auteur: string,
    météo: Météo,
    date: Date,
  ): Promise<SynthèseDesRésultats>;
  récupérerLesPlusRécentesGroupéesParChantier(
    chantiersIds: Chantier["id"][],
    maille: string,
    codeInsee: string,
  ): Promise<Record<Chantier["id"], SynthèseDesRésultats>>;
}
