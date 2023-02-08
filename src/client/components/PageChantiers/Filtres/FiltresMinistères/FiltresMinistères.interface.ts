import FiltresStore from '@/stores/useFiltresStore/useFiltresStore.interface';
import Ministère from '@/server/domain/ministère/Ministère.interface';

export default interface FiltresMinistèresProps {
  libellé: string
  catégorieDeFiltre: keyof FiltresStore['filtresActifs']
  ministères: Ministère[]
}
