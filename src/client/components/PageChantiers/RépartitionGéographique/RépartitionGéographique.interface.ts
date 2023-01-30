import {
  DonnéesTerritoires,
  TerritoireSansCodeInsee,
} from '@/client/utils/chantier/donnéesTerritoires/donnéesTerritoires';
import { Agrégation } from '@/client/utils/types';

export default interface RépartitionGéographiqueProps {
  donnéesTerritoiresAgrégées: DonnéesTerritoires<Agrégation<TerritoireSansCodeInsee>>
}
