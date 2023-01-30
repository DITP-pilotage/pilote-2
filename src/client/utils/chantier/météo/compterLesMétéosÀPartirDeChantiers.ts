import {
  DonnéesTerritoires, réduireDonnéesTerritoires, TerritoireSansCodeInsee,
} from '@/client/utils/chantier/donnéesTerritoires/donnéesTerritoires';
import { CompteurMétéos } from '@/components/PageChantiers/RépartitionMétéo/RépartitionMétéoProps.interface';
import { Agrégation } from '@/client/utils/types';

export default function compterLesMétéosÀPartirDeChantiers(
  donnéesTerritoiresAgrégés: DonnéesTerritoires<Agrégation<TerritoireSansCodeInsee>>,
) {
  return réduireDonnéesTerritoires<CompteurMétéos>(
    donnéesTerritoiresAgrégés,
    (territoiresAgrégés) => {
      const météos = territoiresAgrégés.météo;
      return {
        'NON_RENSEIGNEE': météos.filter(météo => météo === 'NON_RENSEIGNEE').length,
        'ORAGE': météos.filter(météo => météo === 'ORAGE').length,
        'COUVERT': météos.filter(météo => météo === 'COUVERT').length,
        'NUAGE': météos.filter(météo => météo === 'NUAGE').length,
        'SOLEIL': météos.filter(météo => météo === 'SOLEIL').length,
        'NON_NECESSAIRE': météos.filter(météo => météo === 'NON_NECESSAIRE').length,
      };
    },
    {
      'NON_RENSEIGNEE': 0,
      'ORAGE': 0,
      'COUVERT': 0,
      'NUAGE': 0,
      'SOLEIL': 0,
      'NON_NECESSAIRE': 0,
    },
  );
}
