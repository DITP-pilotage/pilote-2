import { ChantierTendance } from '@/server/domain/chantier/Chantier.interface';

const Alerte = {
  estEnAlerteÉcart(écart: number | null) {
    if (écart === null) {
      return false;
    }
    return écart < -10;
  },
  estEnAlerteBaisse: (tendance: ChantierTendance | null) => {
    if (!tendance)
      return false;

    return tendance === 'BAISSE';
  },
  estEnAlerteDonnéesNonMàj(dateDonnéesQualitatives: string | null, dateDonnéesQuantitatives: string | null) {
    if (dateDonnéesQualitatives === null && dateDonnéesQuantitatives !== null) {
      return true;
    }
    if (dateDonnéesQualitatives === null || dateDonnéesQuantitatives === null) {
      return false;
    }
    return dateDonnéesQualitatives < dateDonnéesQuantitatives;
  },
  estEnAlerteTauxAvancementNonCalculé(tauxAvancement: number | null) {
    return tauxAvancement === null;
  },
};

export default Alerte;
