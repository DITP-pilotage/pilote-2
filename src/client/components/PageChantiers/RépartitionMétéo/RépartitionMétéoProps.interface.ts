import Météo from '@/server/domain/chantier/Météo.interface';
import {
  DonnéesTerritoires,
  TerritoireSansCodeInsee,
} from '@/client/utils/chantier/donnéesTerritoires/donnéesTerritoires';
import { Agrégation } from '@/client/utils/types';

export type CompteurMétéos = {
  [k in Météo]: number;
};

export default interface RépartitonMétéoProps {
  donnéesTerritoiresAgrégées: DonnéesTerritoires<Agrégation<TerritoireSansCodeInsee>>;
}
