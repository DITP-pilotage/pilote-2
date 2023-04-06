import { Météo, météos } from '@/server/domain/météo/Météo.interface';

const ORDRE_DES_MÉTÉOS: typeof météos = ['NON_RENSEIGNEE', 'ORAGE', 'NUAGE', 'COUVERT', 'SOLEIL', 'NON_NECESSAIRE'];

export function comparerMétéo(a: Météo, b: Météo) {
  const indexA = ORDRE_DES_MÉTÉOS.indexOf(a);
  const indexB = ORDRE_DES_MÉTÉOS.indexOf(b);
  if (indexA === -1 || indexB === -1)
    throw new Error('météo inconnue');
  if (indexA < indexB)
    return -1;
  if (indexA > indexB)
    return 1;
  return 0;
}
