import { DetailValidationFichier } from '@/server/import-indicateur/domain/DetailValidationFichier';

interface MesureIndicateurTemporaireContrat {
  indicId: string
  metricDate: string
  metricType: string
  metricValue: string
  zoneId: string
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
