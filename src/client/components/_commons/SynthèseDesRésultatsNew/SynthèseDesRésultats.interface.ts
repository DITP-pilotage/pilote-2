import SynthèseDesRésultats from '@/server/domain/chantier/synthèseDesRésultats/SynthèseDesRésultats.interface';
import SynthèseDesRésultatsProjetStructurant
  from '@/server/domain/projetStructurant/synthèseDesRésultats/SynthèseDesRésultats.interface';

export interface SynthèseDesRésultatsProps {
  synthèseDesRésultatsInitiale: SynthèseDesRésultats | SynthèseDesRésultatsProjetStructurant
  réformeId: string
  territoireCode: string
  nomTerritoire: string
  modeÉcriture?: boolean
  estInteractif?: boolean
}
