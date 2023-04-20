import { RouterOutputs } from '@/server/infrastructure/api/trpc/trpc.interface';

export interface SynthèseDesRésultatsProps {
  synthèseDesRésultatsInitiale: RouterOutputs['synthèseDesRésultats']['récupérerLaPlusRécente']
  modeÉcriture: boolean
  rechargerChantier: () => void
}
