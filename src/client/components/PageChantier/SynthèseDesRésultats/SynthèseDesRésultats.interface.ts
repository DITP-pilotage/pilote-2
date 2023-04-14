import SynthèseDesRésultats from '@/server/domain/synthèseDesRésultats/SynthèseDesRésultats.interface';

export interface SynthèseDesRésultatsProps {
  synthèseDesRésultatsInitiale: SynthèseDesRésultats
  modeÉcriture: boolean
  refetchRépartitionGéographique: () => void
}
