import { Chantier } from "@/shared/chantier/Chantier.interface";
import {
  SynthèseDesRésultats,
  SyntheseDesResultatsV2,
} from "@/shared/chantier/syntheseDesResultats/SyntheseDesResultats.interface";

export interface SynthèseDesRésultatsRepository {
  save(synthèse: SyntheseDesResultatsV2): Promise<void>;
  getById(id: string): Promise<SyntheseDesResultatsV2 | null>;
  récupérerLesPlusRécentesGroupéesParChantier(
    chantiersIds: Chantier["id"][],
    maille: string,
    codeInsee: string,
  ): Promise<Record<Chantier["id"], SynthèseDesRésultats>>;
}
