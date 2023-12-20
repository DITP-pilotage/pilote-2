/* eslint-disable react-hooks/rules-of-hooks */
import { create } from 'zustand';
import FiltresUtilisateursStore, {
  FiltresUtilisateursActifs,
} from '@/stores/useFiltresUtilisateursStore/useFiltresUtilisateursStore.interface';

const filtresActifsInitiaux: FiltresUtilisateursActifs = {
  territoires: [],
  périmètresMinistériels: [],
  chantiersAssociésAuxPérimètres: [],
  chantiers: [],
  profils: [],
};

const useFiltresUtilisateursStore = create<FiltresUtilisateursStore>((set) => ({
  filtresActifs: filtresActifsInitiaux,
  actions: {
    modifierÉtatDuFiltre: (filtres, catégorieDeFiltre, chantiersSynthétisés) => {
      
      if (catégorieDeFiltre === 'périmètresMinistériels') {
        const filtresChantiersSupplémentaires = chantiersSynthétisés?.filter(chantier => chantier.périmètreIds.some(périmètreId => filtres.includes(périmètreId)));
        set(étatActuel => ({
          filtresActifs: {
            ...étatActuel.filtresActifs,
            [catégorieDeFiltre]: filtres,
            ['chantiersAssociésAuxPérimètres']: filtresChantiersSupplémentaires?.map(c => c.id) ?? [],
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

export const actions = () => useFiltresUtilisateursStore(étatActuel => étatActuel.actions);
export const filtresUtilisateursActifsStore = () => useFiltresUtilisateursStore(étatActuel => étatActuel.filtresActifs);
export const réinitialiser = () => useFiltresUtilisateursStore.getState().actions.réinitialiser;
