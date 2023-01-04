import { Territoire } from '@/components/_commons/Cartographie/Cartographie.interface';

export default interface BulleDInfoProps {
  x: number,
  y: number,
  territoireSurvolé: Partial<Territoire> | null
}
