import FiltresStore from '@/stores/useFiltresStore/useFiltresStore.interface';
import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface';

export default interface SélecteurMultipleProps {
  libellé: string
  catégorieDeFiltre: keyof FiltresStore['filtresActifs']
  filtres: PérimètreMinistériel[]
}
