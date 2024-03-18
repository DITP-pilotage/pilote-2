import { SyntheseDesResultats } from '@/server/fiche-conducteur/domain/SyntheseDesResultats';

export interface SynthèseDesRésultatsRepository {
  recupererLaPlusRecenteMailleNatParChantierId(chantierId: string): Promise<SyntheseDesResultats | null>
}
