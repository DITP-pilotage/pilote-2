import { SortingState } from '@tanstack/react-table';
import { ChantierTendance } from '@/server/chantiers/domain/Chantier.interface';
import { BadgeType } from '@/components/_commons/Badge/Badge.interface';

const ORDRE_DES_TENDANCE: ChantierTendance[] = ['BAISSE', 'HAUSSE', 'STAGNATION'];
 
export const badgeTypeÀPartirDeLaTendance: Record<NonNullable<ChantierTendance>, BadgeType> = {
  'HAUSSE': 'vert',
  'BAISSE': 'rouge',
  'STAGNATION': 'bleu',
};
  
export const libelléÀPartirDeLaTendance: Record<NonNullable<ChantierTendance>, string> = {
  'HAUSSE': 'En hausse',
  'BAISSE': 'En baisse',
  'STAGNATION': 'Stable',
};
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
