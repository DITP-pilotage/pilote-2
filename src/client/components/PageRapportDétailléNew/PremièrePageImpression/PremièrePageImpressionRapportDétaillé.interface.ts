import { FiltresActifs } from '@/stores/useFiltresStore/useFiltresStore.interface';
import { DétailTerritoire } from '@/server/domain/territoire/Territoire.interface';
import Ministère from '@/server/domain/ministère/Ministère.interface';

export default interface PremièrePageImpressionRapportDétailléProps {
  filtresActifs: FiltresActifs,
  territoireSélectionné: DétailTerritoire | null,
  ministères: Ministère[],
}
