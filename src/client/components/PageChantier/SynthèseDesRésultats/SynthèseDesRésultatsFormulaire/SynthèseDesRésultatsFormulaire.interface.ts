import { Météo } from '@/server/domain/météo/Météo.interface';

export default interface SynthèseDesRésultatsFormulaireProps {
  contenuParDéfaut?: string
  météoParDéfaut?: Météo
  limiteDeCaractères: number
  àLaSoumission: (contenuÀCréer: string, météo: Météo) => void
  àLAnnulation: () => void
  alerte: { type: 'succès' | 'erreur', message: string } | null
}
