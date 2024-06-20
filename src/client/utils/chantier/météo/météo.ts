import { SortingState } from '@tanstack/react-table';
import { Météo, météos } from '@/server/domain/météo/Météo.interface';

const ORDRE_DES_MÉTÉOS: typeof météos = ['NON_RENSEIGNEE', 'ORAGE', 'NUAGE', 'COUVERT', 'SOLEIL', 'NON_NECESSAIRE'];

export function comparerMétéo(a: Météo, b: Météo, tri?: SortingState) {
  const indexA = ORDRE_DES_MÉTÉOS.indexOf(a);
  const indexB = ORDRE_DES_MÉTÉOS.indexOf(b);
  const sensDeTriDesc = tri?.[0].desc;
  if (indexA ===  ORDRE_DES_MÉTÉOS.indexOf('NON_RENSEIGNEE'))
    return sensDeTriDesc ? -1 : 1;
  if (indexB ===  ORDRE_DES_MÉTÉOS.indexOf('NON_RENSEIGNEE'))
    return sensDeTriDesc ? 1 : -1;
  if (indexA < indexB)
    return -1;
  if (indexA > indexB)
    return 1;
  return 0;
}
