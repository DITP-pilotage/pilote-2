import { SortingState } from '@tanstack/react-table';

export function comparerAvancementRéforme(a: number | null, b: number | null, tri: SortingState | null) {
  const sensDeTriDesc = tri === null ? true : tri[0].desc;
  if (a === null && b === null)
    return 0;
  if (a === null)
    return sensDeTriDesc ? -1 : 1;
  if (b === null)
    return sensDeTriDesc ? 1 : -1;
  if (a < b)
    return -1;
  if (a > b)
    return 1;
  return 0;
}
