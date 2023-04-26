import { RouterOutputs } from '@/server/infrastructure/api/trpc/trpc.interface';

export interface SynthèseDesRésultatsProps {
  synthèseDesRésultatsInitiale: RouterOutputs['synthèseDesRésultats']['récupérerLaPlusRécente']
  rechargerChantier: () => void
  chantierId: string
  modeÉcriture?: boolean
  estInteractif?: boolean
}
