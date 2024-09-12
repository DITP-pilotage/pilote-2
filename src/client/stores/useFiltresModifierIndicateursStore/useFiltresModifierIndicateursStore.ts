/* eslint-disable react-hooks/rules-of-hooks */
import { create } from 'zustand';
import FiltresModifierIndicateursStore, {
  FiltresModifierIndicateursActifs,
} from '@/stores/useFiltresModifierIndicateursStore/useFiltresModifierIndicateursStore.interface';

const filtresActifsInitiaux: FiltresModifierIndicateursActifs = {
  chantiers: [],
  chantiersAssociésAuxPérimètres: [],
  périmètresMinistériels: [],
  territoires: [],
};

const useFiltresModifierIndicateursStore = create<FiltresModifierIndicateursStore>((set) => ({
  filtresActifs: filtresActifsInitiaux,
  actions: {
    modifierÉtatDuFiltre: (filtres, catégorieDeFiltre, chantiersSynthétisés) => {

      if (catégorieDeFiltre === 'périmètresMinistériels') {
        const filtresChantiersSupplémentaires = chantiersSynthétisés?.filter(chantier => chantier.périmètreIds.some(périmètreId => filtres.includes(périmètreId)));
        set(étatActuel => ({
          filtresActifs: {
            ...étatActuel.filtresActifs,
            [catégorieDeFiltre]: filtres,
            ['chantiersAssociésAuxPérimètres']: filtresChantiersSupplémentaires?.map(chantierSynthétisé => chantierSynthétisé.id) ?? [],
          },
        }));
      } else {
        set(étatActuel => ({
          filtresActifs: {
            ...étatActuel.filtresActifs,
            [catégorieDeFiltre]: filtres,
          },
        }));
      }
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
export const réinitialiser = () => useFiltresModifierIndicateursStore.getState().actions.réinitialiser;
