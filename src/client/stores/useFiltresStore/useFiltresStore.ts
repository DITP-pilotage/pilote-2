import create from 'zustand';
import FiltresStore from './useFiltresStore.interface';

const useFiltresStore = create<FiltresStore>(set => ({
  filtresActifs: {
    périmètresMinistériels: [],
  },
  activerUnFiltre: (id, catégorieDeFiltre) => set(étatActuel => ({
    filtresActifs: {
      ...étatActuel.filtresActifs,
      [catégorieDeFiltre]: [...étatActuel.filtresActifs[catégorieDeFiltre], id],
    },
  })),
  désactiverUnFiltre: (id, catégorieDeFiltre) => set(étatActuel => ({
    filtresActifs: {
      ...étatActuel.filtresActifs,
      [catégorieDeFiltre]: étatActuel.filtresActifs[catégorieDeFiltre].filter(idFiltreActif => idFiltreActif !== id),
    },
  })),
}));

export default useFiltresStore;
