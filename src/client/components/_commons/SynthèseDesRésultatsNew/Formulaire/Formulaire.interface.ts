import SynthèseDesRésultats from '@/server/domain/chantier/synthèseDesRésultats/SynthèseDesRésultats.interface';
import { Météo, MétéoSaisissable } from '@/server/domain/météo/Météo.interface';

export default interface SynthèseDesRésultatsFormulaireProps {
  contenuInitial?: string
  météoInitiale?: Météo
  synthèseDesRésultatsCrééeCallback?: (synthèseDesRésultatsCréée: SynthèseDesRésultats) => void
  annulationCallback?: () => void
}

export interface SynthèseDesRésultatsFormulaireInputs {
  contenu: string,
  météo: MétéoSaisissable,
}
