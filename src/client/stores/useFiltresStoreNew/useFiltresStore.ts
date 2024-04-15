import { create } from 'zustand';
import FiltresStore from './useFiltresStore.interface';

const useFiltresStore = create<FiltresStore>((set) => ({
  filtresActifs: {},
  actions: {
    désactiverUnFiltre: () => set(() => ({
      filtresActifs: {},
    })),
  },
}));

// eslint-disable-next-line react-hooks/rules-of-hooks
export const filtresActifs = () => useFiltresStore(étatActuel => étatActuel.filtresActifs);
export const désactiverUnFiltreFn = useFiltresStore.getState().actions.désactiverUnFiltre;
