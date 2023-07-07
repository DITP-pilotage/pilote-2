import { DétailTerritoire } from '@/server/domain/territoire/Territoire.interface';
import { FiltresActifs } from '@/client/stores/useFiltresStore/useFiltresStore.interface';

export interface FiltresSélectionnésProps {
  territoiresSélectionnés: DétailTerritoire | null;
  filtresActifs: FiltresActifs;
}
