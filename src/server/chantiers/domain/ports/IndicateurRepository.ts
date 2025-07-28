import { DonneeIndicateur } from '@/server/chantiers/domain/DonneeIndicateur';
import { IndicateurPourExport } from '@/server/chantiers/domain/IndicateurPourExport';
import { HistoriqueIndicateurPourExport } from '@/server/chantiers/domain/HistoriqueIndicateurPourExport';

export interface IndicateurRepository {
  listerParIndicId({ indicId, jalon }: { indicId: string, jalon: number }): Promise<DonneeIndicateur[]>;
  supprimerPropositionValeurAvancement({
    indicId,
    territoireCode,
    auteurModification,
  }: {
    indicId: string,
    territoireCode: string,
    auteurModification: string,
  }): Promise<void>;
  recupererPourExports(chantierIdsLecture: string, territoireCodesLecture: string[], jalon: number, estAvecCadrage: boolean): Promise<IndicateurPourExport[]>;
  récupérerHistoriquePourExports(chantierIdsLecture: string, territoireCodesLecture: string[], jalon: number): Promise<HistoriqueIndicateurPourExport[]>;
}
