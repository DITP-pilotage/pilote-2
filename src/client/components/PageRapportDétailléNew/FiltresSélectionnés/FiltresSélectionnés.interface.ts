import { DétailTerritoire } from '@/server/domain/territoire/Territoire.interface';
import Ministère from '@/server/domain/ministère/Ministère.interface';
import Axe from '@/server/domain/axe/Axe.interface';

export interface FiltresSélectionnésProps {
  territoireSélectionné: DétailTerritoire | null;
  ministères: Ministère[]
  axes: Axe[],
}
