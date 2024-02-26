import { ChantierTendance } from '@/server/domain/chantier/Chantier.interface';

const Alerte = {
  estEnAlerteÉcart(écart: number | null) {
    if (écart === null) {
      return false;
    }
    return écart < -10;
  },
  estEnAlerteBaisseOuStagnation: (tendance: ChantierTendance | null) => {
    if (!!!tendance) 
      return false;

    return ['BAISSE', 'STAGNATION'].includes(tendance);
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
};

export default Alerte;
