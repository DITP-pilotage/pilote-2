import FiltresStore from '@/stores/useFiltresStore/useFiltresStore.interface';
import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface';

export type Ministère = { nom: string, périmètresMinistériels: PérimètreMinistériel[] };

export default interface FiltresMinistèresProps {
  libellé: string
  catégorieDeFiltre: keyof FiltresStore['filtresActifs']
  ministères: Ministère[]
}
