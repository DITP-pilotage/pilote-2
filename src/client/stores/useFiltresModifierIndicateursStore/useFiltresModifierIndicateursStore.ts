/* eslint-disable react-hooks/rules-of-hooks */
import { create } from 'zustand';
import FiltresModifierIndicateursStore, {
  FiltresModifierIndicateursActifs,
} from '@/stores/useFiltresModifierIndicateursStore/useFiltresModifierIndicateursStore.interface';

const filtresActifsInitiaux: FiltresModifierIndicateursActifs = {
  chantiers: [],
};

const useFiltresModifierIndicateursStore = create<FiltresModifierIndicateursStore>((set) => ({
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
    désactiverFiltre: (filtre, catégorieDeFiltre) => {
      set(étatActuel => {
        const filtres = [...étatActuel.filtresActifs[catégorieDeFiltre]];
        const indexFiltreÀDésactiver = filtres.indexOf(filtre);
        filtres.splice(indexFiltreÀDésactiver, 1);

        return ({
          filtresActifs: {
            ...étatActuel.filtresActifs,
            [catégorieDeFiltre]: filtres,
          },
        });
      });
    },
  },
}));

export const actions = () => useFiltresModifierIndicateursStore(étatActuel => étatActuel.actions);
export const filtresModifierIndicateursActifsStore = () => useFiltresModifierIndicateursStore(étatActuel => étatActuel.filtresActifs);
