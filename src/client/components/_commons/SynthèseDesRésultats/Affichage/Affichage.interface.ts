import { RouterOutputs } from '@/server/infrastructure/api/trpc/trpc.interface';

export default interface SynthèseDesRésultatsAffichageProps {
  synthèseDesRésultats: RouterOutputs['synthèseDesRésultats']['récupérerLaPlusRécente']
  afficherContenuComplet?: boolean
}
