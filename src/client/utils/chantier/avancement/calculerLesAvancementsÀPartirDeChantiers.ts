import { AvancementsBarreDeProgression } from '@/components/PageChantiers/TauxAvancementMoyen/TauxAvancementMoyen.interface';
import { Agrégation } from '@/client/utils/types';
import { calculerMoyenne, calculerMédiane, valeurMinimum, valeurMaximum } from '../../statistiques';
import {
  réduireDonnéesTerritoires,
  DonnéesTerritoires, TerritoireSansCodeInsee,
} from '../donnéesTerritoires/donnéesTerritoires';

export default function calculerLesAvancementsÀPartirDeChantiers(
  donnéesTerritoiresAgrégées: DonnéesTerritoires<Agrégation<TerritoireSansCodeInsee>>,
) {
  return réduireDonnéesTerritoires<AvancementsBarreDeProgression>(
    donnéesTerritoiresAgrégées,
    (territoiresAgrégés) => {
      const avancementsAnnuels = territoiresAgrégés.avancement.map(avancement => avancement.annuel);
      const avancementsGlobaux = territoiresAgrégés.avancement.map(avancement => avancement.global);
      return { 
        global: {
          moyenne: calculerMoyenne(avancementsGlobaux),
          médiane: calculerMédiane(avancementsGlobaux), 
          minimum: valeurMinimum(avancementsGlobaux), 
          maximum: valeurMaximum(avancementsGlobaux), 
        }, 
        annuel: {
          moyenne: calculerMoyenne(avancementsAnnuels),
          médiane: calculerMédiane(avancementsAnnuels),
          minimum: valeurMinimum(avancementsAnnuels), 
          maximum: valeurMaximum(avancementsAnnuels),
        }, 
      };
    },
    {
      global: {
        moyenne: null,
        médiane: null, 
        minimum: null, 
        maximum: null,
      }, 
      annuel: {
        moyenne: null,
        médiane: null,
        minimum: null, 
        maximum: null,
      },
    },
  );
}
