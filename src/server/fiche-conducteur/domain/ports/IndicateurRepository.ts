import { Indicateur } from '@/server/fiche-conducteur/domain/Indicateur';

export interface IndicateurRepository {
  récupérerIndicImpactParChantierId: (chantierId: string) => Promise<Indicateur[]>
}
