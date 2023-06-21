import Chantier from '@/server/domain/chantier/Chantier.interface';
import {
  territoireSélectionnéTerritoiresStore,
} from '@/stores/useTerritoiresStore/useTerritoiresStore';

export function useRemontéesAlertes(chantiersFiltrés: Chantier[]) {
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();

  if (territoireSélectionné === null) {
    return {
      remontéesAlertes: [],
      chantiersSélectionnésAlertes: chantiersFiltrés,
    };
  }

  const { maille, codeInsee } = territoireSélectionné;

  const chantiersEnAlerteÉcart = chantiersFiltrés.filter(chantier => chantier.mailles[maille][codeInsee].écart < -10);
  const chantiersEnAlerteBaisseOuStagnation = chantiersFiltrés.filter(chantier => chantier.mailles[maille][codeInsee].tendance !== 'HAUSSE');
  const chantiersEnAlerteNonMaj = chantiersFiltrés.filter(chantier => chantier.mailles[maille][codeInsee].estEnAlerteNonMaj);

  return {
    remontéesAlertes: [
      {
        libellé: 'Écart(s) supérieur(s) de 10 points à la moyenne nationale',
        nombre: chantiersEnAlerteÉcart.length,
        estActivée: false,
      },
      {
        libellé: 'Tendance(s) en baisse ou en stagnation',
        nombre: chantiersEnAlerteBaisseOuStagnation.length,
        estActivée: true,
      },
      {
        libellé: 'Météo(s) ou commentaire(s) non renseigné(s) ou non mis à jour',
        nombre: chantiersEnAlerteNonMaj.length,
        estActivée: false,
      },
    ],
    chantiersSélectionnésAlertes: chantiersFiltrés,
  };
}
