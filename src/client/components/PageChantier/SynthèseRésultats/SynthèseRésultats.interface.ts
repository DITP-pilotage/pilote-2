import SynthèseDesRésultats from '@/server/domain/synthèseDesRésultats/SynthèseDesRésultats.interface';
import { Météo } from '@/server/domain/météo/Météo.interface';

export interface SynthèseRésultatsProps {
  météo: Météo
  synthèseDesRésultats: SynthèseDesRésultats
}
