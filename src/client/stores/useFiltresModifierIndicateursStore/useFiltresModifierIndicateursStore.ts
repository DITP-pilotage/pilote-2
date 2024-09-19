/* eslint-disable react-hooks/rules-of-hooks */
import { create } from 'zustand';

export type FiltresIndicateurs = {
  chantiers: string[]
  perimetresMinisteriels: string[]
  estTerritorialise: boolean
  estBarometre: boolean
};

export default interface FiltresModifierIndicateursStore {
  filtresActifs: FiltresIndicateurs,
  actions: {
    sauvegarderFiltres: (filtre: Partial<FiltresIndicateurs>) => void
    réinitialiser: () => void,
  }
}

const filtresActifsInitiaux: FiltresIndicateurs = {
  chantiers: [],
  perimetresMinisteriels: [],
  estTerritorialise: false,
  estBarometre: false,
};

const useFiltresModifierIndicateursStore = create<FiltresModifierIndicateursStore>((set) => ({
  filtresActifs: filtresActifsInitiaux,
  actions: {
    sauvegarderFiltres: (filtre: Partial<FiltresIndicateurs>) => set((etatActuel) => ({
      filtresActifs: {
        ...etatActuel.filtresActifs,
        ...filtre,
      },
    })),
    réinitialiser: () => {
      set(() => ({
        filtresActifs: { ...filtresActifsInitiaux },
      }));
    },
  },
}));

export const actions = () => useFiltresModifierIndicateursStore(étatActuel => étatActuel.actions);
export const filtresModifierIndicateursActifsStore = () => useFiltresModifierIndicateursStore(étatActuel => étatActuel.filtresActifs);
