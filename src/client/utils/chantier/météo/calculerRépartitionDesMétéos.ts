import Météo from '@/server/domain/chantier/Météo.interface';

export default function calculerRépartitionDesMétéos(météos: Météo[]) {
  let répartitionMétéos = {
    'NON_RENSEIGNEE': 0,
    'ORAGE': 0,
    'COUVERT': 0,
    'NUAGE': 0,
    'SOLEIL': 0,
    'NON_NECESSAIRE': 0,
  };

  météos.forEach(météo => répartitionMétéos[météo] += 1);

  return répartitionMétéos;
}
