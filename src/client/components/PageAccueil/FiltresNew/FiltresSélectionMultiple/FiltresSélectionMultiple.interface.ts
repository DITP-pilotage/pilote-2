import Axe from '@/server/domain/axe/Axe.interface';

export default interface FiltresSélectionMultipleProps {
  catégorieDeFiltre: 'axes',
  filtres: Axe[],
  libellé: string,
}
