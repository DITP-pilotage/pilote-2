import Ppg from '@/server/domain/ppg/Ppg.interface';
import Axe from '@/server/domain/axe/Axe.interface';

export default interface FiltresSélectionMultipleProps {
  catégorieDeFiltre: 'axes' | 'ppg',
  filtres: (Axe | Ppg)[],
  libellé: string,
}
