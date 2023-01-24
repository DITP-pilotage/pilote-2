import Chantier, { Avancement } from '@/server/domain/chantier/Chantier.interface';
import { calculerMoyenne, calculerMédiane, valeurMinimum, valeurMaximum } from '../../statistiques';
import { réduireDonnéesTerritoires, agrégerDonnéesTerritoires } from '../donnéesTerritoires/donnéesTerritoires';

export default function compterLesAvancementsÀPartirDeChantiers(chantiers: Chantier[]) {
  return réduireDonnéesTerritoires<Avancement>(
    agrégerDonnéesTerritoires(chantiers.map(chantier => chantier.mailles)),
    (territoiresAgrégés) => {
      const avancementsAnnuels = territoiresAgrégés.avancement.map(avancement => avancement.annuel);
      const avancementsGlobaux = territoiresAgrégés.avancement.map(avancement => avancement.global);
      return { 
        global: calculerMoyenne(avancementsGlobaux), 
        médianeGlobal: calculerMédiane(avancementsGlobaux), 
        minimumGlobal: valeurMinimum(avancementsGlobaux), 
        maximumGlobal: valeurMaximum(avancementsGlobaux), 
        annuel: calculerMoyenne(avancementsAnnuels),
        médianeAnnuel: calculerMédiane(avancementsAnnuels),
        minimumAnnuel: valeurMinimum(avancementsAnnuels), 
        maximumAnnuel: valeurMaximum(avancementsAnnuels),
      };
    },
    {
      global: null, 
      annuel: null,
    },
  );
}
