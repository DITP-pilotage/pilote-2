import Chantier from '@/server/domain/chantier/Chantier.interface';
import {
  territoireSélectionnéTerritoiresStore,
} from '@/stores/useTerritoiresStore/useTerritoiresStore';
import { actions as actionsFiltresStore } from '@/stores/useFiltresStore/useFiltresStore';
import CompteurFiltre from '@/client/utils/filtres/CompteurFiltre';

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

  const compteurFiltre = new CompteurFiltre(chantiersFiltrés);

  const filtresComptesCalculés = compteurFiltre.compter([{
    nomCritère: 'estEnAlerteÉcart',
    condition: (chantier) => chantier.mailles[maille]?.[codeInsee]?.écart !== null ? chantier.mailles[maille][codeInsee].écart! < -10 : false,
  }, {
    nomCritère: 'estEnAlerteTendance',
    condition: (chantier) => chantier.mailles[maille][codeInsee].tendance !== null ? ['BAISSE', 'STAGNATION'].includes(chantier.mailles[maille][codeInsee].tendance!) : false,
  }, {
    nomCritère: 'estEnAlerteNonMaj',
    condition: () => false,
  }]);

  return {
    remontéesAlertes: [
      {
        libellé: 'Écart(s) supérieur(s) de 10 points à la moyenne nationale',
        nombre: maille === 'nationale' ? null : filtresComptesCalculés.estEnAlerteÉcart.nombre,
        auClic: () => changerÉtatDuFiltre({ id: 'estEnAlerteÉcart', nom: 'Écart(s) supérieur(s) de 10 points à la moyenne nationale' }, 'filtresAlerte'),
        estActivée: estActif('estEnAlerteÉcart', 'filtresAlerte'),
      },
      {
        libellé: 'Tendance(s) en baisse ou en stagnation',
        nombre: filtresComptesCalculés.estEnAlerteTendance.nombre,
        auClic: () => changerÉtatDuFiltre({ id: 'estEnAlerteTendance', nom: 'Tendance(s) en baisse ou en stagnation' }, 'filtresAlerte'),
        estActivée: estActif('estEnAlerteTendance', 'filtresAlerte'),
      },
      {
        libellé: 'Météo(s) ou commentaire(s) non renseigné(s) ou non mis à jour',
        nombre: filtresComptesCalculés.estEnAlerteNonMaj.nombre,
        auClic: () => changerÉtatDuFiltre({ id: 'estEnAlerteNonMaj', nom: 'Météo(s) ou commentaire(s) non renseigné(s) ou non mis à jour' }, 'filtresAlerte'),
        estActivée: estActif('estEnAlerteNonMaj', 'filtresAlerte'),
      },
    ],
  };
}
