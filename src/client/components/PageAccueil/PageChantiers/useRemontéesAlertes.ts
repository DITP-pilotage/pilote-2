import Chantier from '@/server/domain/chantier/Chantier.interface';
import {
  territoireSélectionnéTerritoiresStore,
} from '@/stores/useTerritoiresStore/useTerritoiresStore';
import { actions as actionsFiltresStore } from '@/stores/useFiltresStore/useFiltresStore';

export function useRemontéesAlertes(chantiersFiltrés: Chantier[]) {
  const { changerÉtatDuFiltre, estActif } = actionsFiltresStore();
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();

  if (territoireSélectionné === null) {
    return {
      remontéesAlertes: [],
      chantiersSélectionnésAlertes: chantiersFiltrés,
    };
  }

  const { maille, codeInsee } = territoireSélectionné;

  const chantiersEnAlerteÉcart = chantiersFiltrés.filter(chantier => chantier.mailles[maille][codeInsee].alertes.estEnAlerteÉcart);
  const chantiersEnAlerteBaisseOuStagnation = chantiersFiltrés.filter(chantier => chantier.mailles[maille][codeInsee].alertes.estEnAlerteTendance);
  const chantiersEnAlerteNonMaj = chantiersFiltrés.filter(chantier => chantier.mailles[maille][codeInsee].alertes.estEnAlerteNonMaj);

  return {
    remontéesAlertes: [
      {
        libellé: 'Écart(s) supérieur(s) de 10 points à la moyenne nationale',
        nombre: maille === 'nationale' ? null : chantiersEnAlerteÉcart.length,
        auClic: () => changerÉtatDuFiltre({ id: 'estEnAlerteÉcart', nom: 'Écart(s) supérieur(s) de 10 points à la moyenne nationale' }, 'filtresAlerte'),
        estActivée: estActif('estEnAlerteÉcart', 'filtresAlerte'),
      },
      {
        libellé: 'Tendance(s) en baisse ou en stagnation',
        nombre: chantiersEnAlerteBaisseOuStagnation.length,
        auClic: () => changerÉtatDuFiltre({ id: 'estEnAlerteTendance', nom: 'Tendance(s) en baisse ou en stagnation' }, 'filtresAlerte'),
        estActivée: estActif('estEnAlerteTendance', 'filtresAlerte'),
      },
      {
        libellé: 'Météo(s) ou commentaire(s) non renseigné(s) ou non mis à jour',
        nombre: chantiersEnAlerteNonMaj.length,
        auClic: () => changerÉtatDuFiltre({ id: 'estEnAlerteNonMaj', nom: 'Météo(s) ou commentaire(s) non renseigné(s) ou non mis à jour' }, 'filtresAlerte'),
        estActivée: estActif('estEnAlerteNonMaj', 'filtresAlerte'),
      },
    ],
  };
}
