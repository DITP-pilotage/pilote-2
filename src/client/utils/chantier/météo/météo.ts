import { Météo, météos } from '@/server/domain/météo/Météo.interface';

export function comparerMétéo(a: Météo, b: Météo) {
  const indexA = météos.indexOf(a);
  const indexB = météos.indexOf(b);
  if (indexA < indexB)
    return 1;
  if (indexA > indexB)
    return -1;
  return 0;
}
