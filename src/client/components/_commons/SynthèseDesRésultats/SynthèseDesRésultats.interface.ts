import { RouterOutputs } from '@/server/infrastructure/api/trpc/trpc.interface';

export interface SynthèseDesRésultatsProps {
  synthèseDesRésultatsInitiale: RouterOutputs['synthèseDesRésultats']['récupérerLaPlusRécente']
  rechargerRéforme: () => void
  réformeId: string
  nomTerritoire: string
  modeÉcriture?: boolean
  estInteractif?: boolean
}
