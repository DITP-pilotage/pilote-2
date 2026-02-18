import Alerte from "@/server/domain/alerte/Alerte";
import { MeteoDisponible } from "@/server/fiche-territoriale/domain/MeteoDisponible";
import { TypeAlerteChantier } from "@/server/chantiers/app/contrats/TypeAlerteChantier";
import { Maille } from "@/server/domain/maille/Maille.interface";
import { ChantierAccueilContratV2 } from "@/server/chantiers/app/contrats/ChantierAccueilContratV2";
import { ChantierRapportDetailleContrat } from "@/server/chantiers/app/contrats/ChantierRapportDetailleContratV2";

export class Chantier {
  static recupererStatistiqueListeChantier(
    chantiers: ChantierRapportDetailleContrat[] | ChantierAccueilContratV2[],
    mailleChantier: Maille,
    territoireCode: string,
  ) {
    return chantiers.reduce(
      (acc, chantier) => {
        const {
          météo,
          ecart,
          tendance,
          avancement,
          aUnePropositionsValeurAvancement,
        } = chantier.mailles[mailleChantier][territoireCode];

        acc.répartitionMétéos[météo] += 1;
        acc.filtresComptesCalculés = {
          estEnAlerteÉcart: Alerte.estEnAlerteÉcart(ecart.jalonParDefaut)
            ? acc.filtresComptesCalculés.estEnAlerteÉcart + 1
            : acc.filtresComptesCalculés.estEnAlerteÉcart,
          estEnAlerteBaisse: Alerte.estEnAlerteBaisse(tendance)
            ? acc.filtresComptesCalculés.estEnAlerteBaisse + 1
            : acc.filtresComptesCalculés.estEnAlerteBaisse,
          estEnAlerteTauxAvancementNonCalculé:
            Alerte.estEnAlerteTauxAvancementNonCalculé(
              avancement.jalonParDefaut,
              chantier.cibleAttendu,
            )
              ? acc.filtresComptesCalculés.estEnAlerteTauxAvancementNonCalculé +
                1
              : acc.filtresComptesCalculés.estEnAlerteTauxAvancementNonCalculé,
          estEnAlerteAbscenceTauxAvancementDepartemental:
            Alerte.estEnAlerteAbscenceTauxAvancementDepartemental(
              chantier.aUnTauxAvancementDepartemental,
              chantier.cibleAttendu,
            )
              ? acc.filtresComptesCalculés
                  .estEnAlerteAbscenceTauxAvancementDepartemental + 1
              : acc.filtresComptesCalculés
                  .estEnAlerteAbscenceTauxAvancementDepartemental,
          estEnAlerteMétéoNonRenseignée: Alerte.estEnAlerteMétéoNonRenseignée(
            météo,
          )
            ? acc.filtresComptesCalculés.estEnAlerteMétéoNonRenseignée + 1
            : acc.filtresComptesCalculés.estEnAlerteMétéoNonRenseignée,
          estEnAlertePossedePropositionsValeurAvancement:
            Alerte.estEnAlertePossedePropositionsValeurAvancement(
              aUnePropositionsValeurAvancement,
            )
              ? acc.filtresComptesCalculés
                  .estEnAlertePossedePropositionsValeurAvancement + 1
              : acc.filtresComptesCalculés
                  .estEnAlertePossedePropositionsValeurAvancement,
        };

        return acc;
      },
      {
        répartitionMétéos: {
          ORAGE: 0,
          COUVERT: 0,
          NUAGE: 0,
          SOLEIL: 0,
          NON_RENSEIGNEE: 0,
          NON_NECESSAIRE: 0,
        },
        filtresComptesCalculés: {
          estEnAlerteÉcart: 0,
          estEnAlerteBaisse: 0,
          estEnAlerteTauxAvancementNonCalculé: 0,
          estEnAlerteAbscenceTauxAvancementDepartemental: 0,
          estEnAlerteMétéoNonRenseignée: 0,
          estEnAlertePossedePropositionsValeurAvancement: 0,
        },
      } satisfies {
        répartitionMétéos: Record<
          MeteoDisponible | "NON_RENSEIGNEE" | "NON_NECESSAIRE",
          number
        >;
        filtresComptesCalculés: Record<TypeAlerteChantier, number>;
      },
    );
  }
}
