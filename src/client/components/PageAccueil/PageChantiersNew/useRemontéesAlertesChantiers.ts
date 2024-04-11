import { actions as actionsFiltresStore } from '@/stores/useFiltresStore/useFiltresStore';
import CompteurFiltre from '@/client/utils/filtres/CompteurFiltre';
import Alerte from '@/server/domain/alerte/Alerte';
import { ChantierAccueilContrat } from '@/server/chantiers/app/contrats/ChantierAccueilContrat';

export function useRemontéesAlertesChantiers(chantiersFiltrés: ChantierAccueilContrat[], territoireCode: string) {
  const { changerÉtatDuFiltre, estActif } = actionsFiltresStore();

  const [maille, codeInsee] = territoireCode.split('-');

  const mailleChantier = maille === 'NAT' ? 'nationale' : maille === 'REG' ? 'régionale' : 'départementale';

  const compteurFiltre = new CompteurFiltre(chantiersFiltrés);

  const filtresComptesCalculés = compteurFiltre.compter([{
    nomCritère: 'estEnAlerteÉcart',
    condition: (chantier) => Alerte.estEnAlerteÉcart(chantier.mailles[mailleChantier]?.[codeInsee]?.écart),
  }, {
    nomCritère: 'estEnAlerteBaisseOuStagnation',
    condition: (chantier) => Alerte.estEnAlerteBaisseOuStagnation(chantier.mailles[mailleChantier]?.[codeInsee]?.tendance),
  }, {
    nomCritère: 'estEnAlerteDonnéesNonMàj',
    condition: (chantier) => Alerte.estEnAlerteDonnéesNonMàj(chantier.mailles[mailleChantier]?.[codeInsee]?.dateDeMàjDonnéesQualitatives, chantier.mailles[mailleChantier]?.[codeInsee]?.dateDeMàjDonnéesQuantitatives),
  }, {
    nomCritère: 'estEnAlerteTauxAvancementNonCalculé',
    condition: (chantier) => Alerte.estEnAlerteTauxAvancementNonCalculé(chantier.mailles[mailleChantier]?.[codeInsee]?.avancement.global),
  }]);

  return {
    remontéesAlertes: [
      mailleChantier === 'nationale'
        ? {
          nomCritère: 'estEnAlerteTauxAvancementNonCalculé',
          libellé: 'Taux d’avancement non calculé(s) en raison d’indicateurs non renseignés',
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
