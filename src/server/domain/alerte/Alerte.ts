const Alerte = {
  estEnAlerteÉcart(écart: number | null) {
    if (écart === null) {
      return false;
    }
    return écart < -10;
  },
  estEnAlerteBaisseOuStagnation: (tauxAvancementPrécédent: number | null, tauxAvancement: number | null) => {
    if (tauxAvancement === null) {
      return false;
    } else if (tauxAvancementPrécédent === null) {
      return true
    }


    
    return tauxAvancement <= tauxAvancementPrécédent;
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
