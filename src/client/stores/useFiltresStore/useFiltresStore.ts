/* eslint-disable react-hooks/rules-of-hooks */
import create from 'zustand';
import FiltresStore from './useFiltresStore.interface';

const useFiltresStore = create<FiltresStore>((set, get) => ({
  filtresActifs: {
    périmètresMinistériels: [],
  },
  actions: {
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
    estActif: (id, catégorieDeFiltre) => get().filtresActifs[catégorieDeFiltre].includes(id),
  },
}));

export const actions = () => useFiltresStore(étatActuel => étatActuel.actions);
export const filtresActifs = () => useFiltresStore(étatActuel => étatActuel.filtresActifs);
