import { Météo } from '@/server/domain/météo/Météo.interface';

export default interface SynthèseDesRésultatsFormulaireProps {
  contenuInitial?: string
  météoInitiale?: Météo
  limiteDeCaractères: number
  àLaPublication: (contenuÀCréer: string, météo: Météo) => void
  àLAnnulation: () => void
  alerte: { type: 'succès' | 'erreur', message: string } | null
}
