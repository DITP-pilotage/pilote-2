import { DétailTerritoire } from '@/server/domain/territoire/Territoire.interface';
import { FiltresActifs } from '@/client/stores/useFiltresStore/useFiltresStore.interface';

export interface FiltresSélectionnésProps {
  territoireSélectionné: DétailTerritoire | null;
  filtresActifs: FiltresActifs;
}
