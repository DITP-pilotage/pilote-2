import SynthèseDesRésultats from '@/server/domain/chantier/synthèseDesRésultats/SynthèseDesRésultats.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import SynthèseDesRésultatsProjetStructurant
  from '@/server/domain/projetStructurant/synthèseDesRésultats/SynthèseDesRésultats.interface';

export interface SynthèseDesRésultatsProps {
  synthèseDesRésultatsInitiale: SynthèseDesRésultats | SynthèseDesRésultatsProjetStructurant
  rechargerRéforme: () => void
  réformeId: string
  nomTerritoire: string
  modeÉcriture?: boolean
  estInteractif?: boolean
  mailleSourceDonnees? : Maille | null
}
