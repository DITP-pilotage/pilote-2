import Chantier from '@/server/domain/chantier/Chantier.interface';
import SynthèseDesRésultats from '@/server/domain/chantier/SynthèseDesRésultats.interface';

export interface SynthèseRésultatsProps {
  chantier: Chantier
  synthèseDesRésultats: SynthèseDesRésultats
}
