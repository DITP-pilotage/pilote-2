import FiltresStore from '@/stores/useFiltresStore/useFiltresStore.interface';
import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface';

// TODO placé ici en attendant de le déplacer dans /src/server/domain
export type Ministère = { nom: string, périmètresMinistériels: PérimètreMinistériel[] };

export default interface FiltresMinistèresProps {
  libellé: string
  catégorieDeFiltre: keyof FiltresStore['filtresActifs']
  ministères: Ministère[]
}
