const Alerte = {
  estEnAlerteÉcart(écart: number | null) {
    if (écart === null) {
      return false;
    }
    return écart < -10;
  },
  estEnAlerteBaisseOuStagnation: (tauxAvancementPrécédent: number | null, tauxAvancement: number | null) => {
    if (tauxAvancementPrécédent === null || tauxAvancement === null) {
      return false;
    }
    return tauxAvancement <= tauxAvancementPrécédent;
  },
};

export default Alerte;
