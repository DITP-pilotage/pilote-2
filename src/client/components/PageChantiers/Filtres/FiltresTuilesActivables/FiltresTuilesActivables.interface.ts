import { FiltreCatégorie, Filtre } from '@/stores/useFiltresStore/useFiltresStore.interface';

export default interface FiltresTuilesActivablesProps {
  catégorieDeFiltre: FiltreCatégorie,
  filtres: Filtre[],
  libellé: string,
}
