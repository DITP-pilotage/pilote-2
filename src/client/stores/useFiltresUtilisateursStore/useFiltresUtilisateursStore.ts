/* eslint-disable react-hooks/rules-of-hooks */
import { create } from 'zustand';
import FiltresUtilisateursStore, {
  FiltresUtilisateursActifs,
} from '@/stores/useFiltresUtilisateursStore/useFiltresUtilisateursStore.interface';

const filtresActifsInitiaux: FiltresUtilisateursActifs = {
  territoires: [],
  périmètresMinistériels: [],
  chantiers: [],
};

const useFiltresUtilisateursStore = create<FiltresUtilisateursStore>((set) => ({
  filtresActifs: filtresActifsInitiaux,
  actions: {
    modifierÉtatDuFiltre: (filtres, catégorieDeFiltre) => {
      set(étatActuel => ({
        filtresActifs: {
          ...étatActuel.filtresActifs,
          [catégorieDeFiltre]: filtres,
        },
      }));
    },
    réinitialiser: () => {
      set(() => ({
        filtresActifs: { ...filtresActifsInitiaux },
      }));
    },
  },
}));

export const actions = () => useFiltresUtilisateursStore(étatActuel => étatActuel.actions);
export const filtresUtilisateursActifs = () => useFiltresUtilisateursStore(étatActuel => étatActuel.filtresActifs);
export const réinitialiser = () => useFiltresUtilisateursStore.getState().actions.réinitialiser;
