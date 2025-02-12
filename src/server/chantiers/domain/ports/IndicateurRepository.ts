import { DonneeIndicateur } from '@/server/chantiers/domain/DonneeIndicateur';
import { IndicateurPourExport } from '@/server/chantiers/domain/IndicateurPourExport';

export interface IndicateurRepository {
  listerParIndicId({ indicId, jalon }: { indicId: string, jalon: number }): Promise<DonneeIndicateur[]>;
  supprimerPropositionValeurActuelle({
    indicId,
    territoireCode,
    auteurModification,
  }: {
    indicId: string,
    territoireCode: string,
    auteurModification: string,
  }): Promise<void>;
  récupérerPourExports(chantierIdsLecture: string, territoireCodesLecture: string[], jalon: number): Promise<IndicateurPourExport[]>;
}
