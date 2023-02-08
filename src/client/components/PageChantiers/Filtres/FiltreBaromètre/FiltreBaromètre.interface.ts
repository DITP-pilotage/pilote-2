import FiltresStore from '@/client/stores/useFiltresStore/useFiltresStore.interface';

export default interface FiltreBaromètreProps {
  catégorieDeFiltre: keyof FiltresStore['filtresActifs']
}
