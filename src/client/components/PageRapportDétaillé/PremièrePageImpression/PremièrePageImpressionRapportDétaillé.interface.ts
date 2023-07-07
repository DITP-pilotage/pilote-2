import { FiltresActifs } from '@/stores/useFiltresStore/useFiltresStore.interface';
import { DétailTerritoire } from '@/server/domain/territoire/Territoire.interface';
import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface';

export default interface PremièrePageImpressionRapportDétailléProps {
  filtresActifs: FiltresActifs,
  territoireSélectionné: DétailTerritoire | null,
  périmètresMinistériels: PérimètreMinistériel[],
}
