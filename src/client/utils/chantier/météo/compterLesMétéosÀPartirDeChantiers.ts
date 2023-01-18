import {
  agrégerDonnéesTerritoires,
  réduireDonnéesTerritoires,
} from '@/client/utils/chantier/donnéesTerritoires/donnéesTerritoires';
import { CompteurMétéos } from '@/components/PageChantiers/RépartitionMétéo/RépartitionMétéoProps.interface';
import Chantier from '@/server/domain/chantier/Chantier.interface';

export default function compterLesMétéosÀPartirDeChantiers(chantiers: Chantier[]) {
  return réduireDonnéesTerritoires<CompteurMétéos>(
    agrégerDonnéesTerritoires(chantiers.map(chantier => chantier.mailles)),
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
