import {
  DonnéesTerritoires,
  TerritoireSansCodeInsee,
} from '@/client/utils/chantier/donnéesTerritoires/donnéesTerritoires';
import { Agrégation } from '@/client/utils/types';

type AvancementBarreDeProgression = { moyenne: null | number, médiane: null | number, minimum: null | number, maximum: null | number };

export type AvancementsBarreDeProgression = {
  annuel: AvancementBarreDeProgression, 
  global: AvancementBarreDeProgression, 
};
export default interface TauxAvancementMoyenProps {
  donnéesTerritoiresAgrégées: DonnéesTerritoires<Agrégation<TerritoireSansCodeInsee>>
}
