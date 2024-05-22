import { ListeTerritoiresDonnéeAccueilContrat } from '@/server/chantiers/app/contrats/ChantierAccueilContratNew';
import {  ChantierTendance, ChantierVueDEnsemble } from '@/server/domain/chantier/Chantier.interface';

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

  estEnAlerteTauxAvancementNonCalculé(tauxAvancement: number | null) {
    return tauxAvancement === null;
  },

  estEnAlerteAbscenceTauxAvancementDepartemental(departementsDonnées: ListeTerritoiresDonnéeAccueilContrat) {
    const donnéesApplicables = Object.values(departementsDonnées).filter(donnée => donnée.estApplicable);
    return donnéesApplicables.length > 0 && donnéesApplicables.every(donnée => donnée.avancement.global === null);
  },

  estEnAlerteMétéoNonRenseignée(météo: ChantierVueDEnsemble['météo']) {
    return météo === 'NON_RENSEIGNEE' ? true : false;
  },
};

export default Alerte;
