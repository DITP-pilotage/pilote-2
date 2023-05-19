import { FiltreCatégorie, Filtre } from '@/stores/useFiltresStore/useFiltresStore.interface';

export default interface FiltresSélectionMultipleProps {
  catégorieDeFiltre: FiltreCatégorie,
  filtres: Filtre[],
  libellé: string,
}
