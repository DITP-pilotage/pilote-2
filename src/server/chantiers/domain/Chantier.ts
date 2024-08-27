import { ChantierAccueilContrat } from '@/server/chantiers/app/contrats/ChantierAccueilContratNew';
import { ChantierRapportDetailleContrat } from '@/server/chantiers/app/contrats/ChantierRapportDetailleContrat';
import Alerte from '@/server/domain/alerte/Alerte';
import { MeteoDisponible } from '@/server/fiche-territoriale/domain/MeteoDisponible';
import { TypeAlerteChantier } from '@/server/chantiers/app/contrats/TypeAlerteChantier';
import { Maille } from '@/server/domain/maille/Maille.interface';

// eslint-disable-next-line unicorn/no-static-only-class
export class Chantier {
  static recupererStatistiqueListeChantier(chantiers: ChantierRapportDetailleContrat[] | ChantierAccueilContrat[], mailleChantier: Maille, codeInseeSelectionne: string) {
    return chantiers.reduce((acc, chantier) => {
      const { météo, écart, tendance, avancement } = chantier.mailles[mailleChantier][codeInseeSelectionne];

      acc.répartitionMétéos[météo] += 1;
      acc.filtresComptesCalculés = {
        estEnAlerteÉcart: Alerte.estEnAlerteÉcart(écart) ? acc.filtresComptesCalculés.estEnAlerteBaisse + 1 : acc.filtresComptesCalculés.estEnAlerteBaisse,
        estEnAlerteBaisse: Alerte.estEnAlerteBaisse(tendance) ? acc.filtresComptesCalculés.estEnAlerteBaisse + 1 : acc.filtresComptesCalculés.estEnAlerteBaisse,
        estEnAlerteTauxAvancementNonCalculé: Alerte.estEnAlerteTauxAvancementNonCalculé(avancement.global) ? acc.filtresComptesCalculés.estEnAlerteBaisse + 1 : acc.filtresComptesCalculés.estEnAlerteBaisse,
        estEnAlerteAbscenceTauxAvancementDepartemental: Alerte.estEnAlerteAbscenceTauxAvancementDepartemental(chantier.mailles.départementale) ? acc.filtresComptesCalculés.estEnAlerteBaisse + 1 : acc.filtresComptesCalculés.estEnAlerteBaisse,
        estEnAlerteMétéoNonRenseignée: Alerte.estEnAlerteMétéoNonRenseignée(météo) ? acc.filtresComptesCalculés.estEnAlerteBaisse + 1 : acc.filtresComptesCalculés.estEnAlerteBaisse,
      };

      return acc;
    }, {
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
      },
    } satisfies {
      répartitionMétéos: Record<MeteoDisponible | 'NON_RENSEIGNEE' | 'NON_NECESSAIRE', number>,
      filtresComptesCalculés: Record<TypeAlerteChantier, number>
    });
  }
}
