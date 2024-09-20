import { SortingState } from '@tanstack/react-table';
import { ChantierTendance } from '@/server/domain/chantier/Chantier.interface';

const ORDRE_DES_TENDANCE: ChantierTendance[] = ['BAISSE', 'STAGNATION', 'HAUSSE'];

export function comparerTendance(tendanceA: ChantierTendance | null, tendanceB: ChantierTendance | null, tri: SortingState) {

  const sensDeTriDesc = tri[0].desc;
  if (tendanceA === null && tendanceB === null)
    return 0;
  if (tendanceA === null)
    return sensDeTriDesc ? -1 : 1;
  if (tendanceB === null)
    return sensDeTriDesc ? 1 : -1;
  
  const indexA = ORDRE_DES_TENDANCE.indexOf(tendanceA);
  const indexB = ORDRE_DES_TENDANCE.indexOf(tendanceB);
  if (indexA < indexB)
    return -1;
  if (indexA > indexB)
    return 1;
  return 0;

}
