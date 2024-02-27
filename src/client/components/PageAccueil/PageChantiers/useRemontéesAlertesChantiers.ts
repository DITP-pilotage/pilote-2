import Chantier from '@/server/domain/chantier/Chantier.interface';
import {
  territoireSélectionnéTerritoiresStore,
} from '@/stores/useTerritoiresStore/useTerritoiresStore';
import { actions as actionsFiltresStore } from '@/stores/useFiltresStore/useFiltresStore';
import CompteurFiltre from '@/client/utils/filtres/CompteurFiltre';
import Alerte from '@/server/domain/alerte/Alerte';

export function useRemontéesAlertesChantiers(chantiersFiltrés: Chantier[]) {
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
    condition: (chantier) => Alerte.estEnAlerteÉcart(chantier.mailles[maille]?.[codeInsee]?.écart),
  }, {
    nomCritère: 'estEnAlerteBaisseOuStagnation',
    condition: (chantier) => Alerte.estEnAlerteBaisseOuStagnation(chantier.mailles[maille]?.[codeInsee]?.tendance),
  }, {
    nomCritère: 'estEnAlerteDonnéesNonMàj',
    condition: (chantier) => Alerte.estEnAlerteDonnéesNonMàj(chantier.mailles[maille]?.[codeInsee]?.dateDeMàjDonnéesQualitatives, chantier.mailles[maille]?.[codeInsee]?.dateDeMàjDonnéesQuantitatives),
  }, {
    nomCritère: 'estEnAlerteTauxAvancementNonCalculé',
    condition: (chantier) => Alerte.estEnAlerteTauxAvancementNonCalculé(chantier.mailles[maille]?.[codeInsee]?.avancement.global),
  }]);

  return {
    remontéesAlertes: [
      maille === 'nationale' 
        ? {
          nomCritère: 'estEnAlerteTauxAvancementNonCalculé',
          libellé: 'Taux d’avancement non calculé en raison d’indicateurs non renseignés',
          nombre: filtresComptesCalculés.estEnAlerteTauxAvancementNonCalculé.nombre,
          auClic: () => changerÉtatDuFiltre({ id: 'estEnAlerteTauxAvancementNonCalculé', nom: 'Taux d’avancement non calculé en raison d’indicateurs non renseignés' }, 'filtresAlerte'),
          estActivée: estActif('estEnAlerteTauxAvancementNonCalculé', 'filtresAlerte'),
        } 
        : {
          nomCritère: 'estEnAlerteÉcart',
          libellé: 'Retard supérieur de 10 points par rapport à la moyenne nationale',
          nombre: filtresComptesCalculés.estEnAlerteÉcart.nombre,
          auClic: () => changerÉtatDuFiltre({ id: 'estEnAlerteÉcart', nom: 'Retard supérieur de 10 points par rapport à la moyenne nationale' }, 'filtresAlerte'),
          estActivée: estActif('estEnAlerteÉcart', 'filtresAlerte'),       
        },
      {
        nomCritère: 'estEnAlerteBaisseOuStagnation',
        libellé: 'Tendance(s) en baisse ou en stagnation',
        nombre: filtresComptesCalculés.estEnAlerteBaisseOuStagnation.nombre,
        auClic: () => changerÉtatDuFiltre({ id: 'estEnAlerteBaisseOuStagnation', nom: 'Tendance(s) en baisse ou en stagnation' }, 'filtresAlerte'),
        estActivée: estActif('estEnAlerteBaisseOuStagnation', 'filtresAlerte'),
      },
      {
        nomCritère: 'estEnAlerteDonnéesNonMàj',
        libellé: 'Météo(s) ou commentaire(s) non renseigné(s) ou non mis à jour',
        nombre: filtresComptesCalculés.estEnAlerteDonnéesNonMàj.nombre,
        auClic: () => changerÉtatDuFiltre({ id: 'estEnAlerteDonnéesNonMàj', nom: 'Météo(s) ou commentaire(s) non renseigné(s) ou non mis à jour' }, 'filtresAlerte'),
        estActivée: estActif('estEnAlerteDonnéesNonMàj', 'filtresAlerte'),
      },
    ],
  };
}
