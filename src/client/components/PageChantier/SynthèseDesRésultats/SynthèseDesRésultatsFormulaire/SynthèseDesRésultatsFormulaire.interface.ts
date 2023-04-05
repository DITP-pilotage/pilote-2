import SynthèseDesRésultats from '@/server/domain/synthèseDesRésultats/SynthèseDesRésultats.interface';
import { Météo } from '@/server/domain/météo/Météo.interface';

export default interface SynthèseDesRésultatsFormulaireProps {
  contenuInitial?: string
  météoInitiale?: Météo
  limiteDeCaractères: number
  synthèseDesRésultatsCrééeCallback: (synthèseDesRésultatsCréée: SynthèseDesRésultats) => void
  annulationCallback: () => void
}
