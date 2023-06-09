import { DetailValidationFichier } from '@/server/import-indicateur/domain/DetailValidationFichier';

interface MesureIndicateurTemporaireContrat {
  indicId: string | null
  metricDate: string | null
  metricType: string | null
  metricValue: string | null
  zoneId: string | null
}

export interface RapportContrat {
  id: string,
  estValide: boolean,
  listeMesuresIndicateurTemporaire: MesureIndicateurTemporaireContrat[]
}

export function presenterEnRapportContrat(rapport: DetailValidationFichier): RapportContrat {
  return {
    id: rapport.id,
    estValide: rapport.estValide,
    listeMesuresIndicateurTemporaire: rapport.listeMesuresIndicateurTemporaire.map(indicateurData => ({
      indicId: indicateurData.indicId,
      metricDate: indicateurData.metricDate,
      metricType: indicateurData.metricType,
      metricValue: indicateurData.metricValue,
      zoneId: indicateurData.zoneId,
    })),
  };
}
