import SynthèseDesRésultats from '@/server/domain/chantier/synthèseDesRésultats/SynthèseDesRésultats.interface';
import { Maille } from '@/server/chantiers/domain/Maille';

export interface SynthèseDesRésultatsProps {
  synthèseDesRésultatsInitiale: SynthèseDesRésultats
  rechargerRéforme: () => void
  réformeId: string
  nomTerritoire: string
  modeÉcriture?: boolean
  estInteractif?: boolean
  mailleSourceDonnees? : Maille | null
}
