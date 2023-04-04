import { Météo } from '@/server/domain/météo/Météo.interface';

export default interface SynthèseDesRésultatsFormulaireProps {
  contenuParDéfaut?: string
  météoParDéfaut?: Météo
  limiteDeCaractères: number
  àLaSoumission: (contenuÀCréer: string, météo: Météo, csrf: string) => void
  àLAnnulation: () => void
}
