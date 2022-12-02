import FiltresStore from 'client/stores/useFiltresStore/useFiltresStore.interface';
import PérimètreMinistériel from 'server/domain/périmètreMinistériel/périmètreMinistériel.interface';

export default interface SélecteurMultipleProps {
  libellé: string
  catégorieDeFiltre: keyof FiltresStore['filtresActifs']
  filtres: PérimètreMinistériel[]
}
