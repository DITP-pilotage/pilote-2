import Chantier from "@/server/domain/chantier/Chantier.interface";
import SynthèseDesRésultats, {
  SynthèseDesRésultatsV2,
} from "./SynthèseDesRésultats.interface";

export default interface SynthèseDesRésultatsRepository {
  save(synthèse: SynthèseDesRésultatsV2): Promise<void>;
  récupérerLesPlusRécentesGroupéesParChantier(
    chantiersIds: Chantier["id"][],
    maille: string,
    codeInsee: string,
  ): Promise<Record<Chantier["id"], SynthèseDesRésultats>>;
}
