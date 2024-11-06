import { DonneeIndicateur } from '@/server/chantiers/domain/DonneeIndicateur';

export interface IndicateurRepository {
  listerParIndicId({ indicId }: { indicId: string }): Promise<DonneeIndicateur[]>;
  supprimerPropositionValeurActuelle({
    indicId,
    territoireCode,
    auteurModification,
  }: {
    indicId: string,
    territoireCode: string,
    auteurModification: string,
  }): Promise<void>;
}
