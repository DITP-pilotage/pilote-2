import { SyntheseDesResultats } from "@/server/fiche-conducteur/domain/SyntheseDesResultats";

export interface SyntheseDesResultatsRepository {
  recupererLaPlusRecenteMailleNatParChantierId(
    chantierId: string,
  ): Promise<SyntheseDesResultats | null>;
}
