import {
  ChantierTendance,
  ChantierVueDEnsemble,
} from "@/server/domain/chantier/Chantier.interface";

const Alerte = {
  estEnAlerteÉcart(écart: number | null) {
    if (écart === null) {
      return false;
    }
    return écart < -10;
  },

  estEnAlerteBaisse: (tendance: ChantierTendance | null) => {
    if (!tendance) return false;

    return tendance === "BAISSE";
  },

  estEnAlerteTauxAvancementNonCalculé(
    tauxAvancement: number | null,
    cibleAttendu: boolean,
  ) {
    return cibleAttendu && tauxAvancement === null;
  },

  estEnAlerteAbscenceTauxAvancementDepartemental(
    aUnTauxAvancementDepartemental: boolean,
    cibleAttendu: boolean,
  ) {
    return cibleAttendu && !aUnTauxAvancementDepartemental;
  },

  estEnAlerteMétéoNonRenseignée(météo: ChantierVueDEnsemble["météo"]) {
    return météo === "NON_RENSEIGNEE";
  },

  estEnAlertePossedePropositionsValeurAvancement(
    aUnePropositionsValeurAvancement: boolean,
  ) {
    return aUnePropositionsValeurAvancement;
  },
};

export default Alerte;
