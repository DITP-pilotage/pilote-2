/* eslint-disable react-hooks/rules-of-hooks */
import { create } from 'zustand';
import StatutsStore, { CorrespondanceVueStatuts } from './useStatutStore.interface';

const useStatutStore = create<StatutsStore>((set, get) => ({
  vueStatutsSélectionnée: 'BROUILLON_ET_PUBLIE',
  statutsSélectionnés: ['BROUILLON', 'PUBLIE'],
  actions: {
    modifierLaVueSélectionnée: (vueStatuts) => {
      set({ vueStatutsSélectionnée: vueStatuts });
    },

    modifierLesStatutsSélectionnés(statuts) {
      set({ statutsSélectionnés: statuts });
    },

    modifierLaVueSélectionnéeEtLesStatutsAssociés(vueStatuts) {
      get().actions.modifierLaVueSélectionnée(vueStatuts);
      get().actions.modifierLesStatutsSélectionnés(CorrespondanceVueStatuts[vueStatuts]);
    },

    récupérerLaVueSélectionnée: () => {
      return get().vueStatutsSélectionnée;
    },

    recupérerLesStatutsSélectionnés() {
      return get().statutsSélectionnés;
    },
  },
}));

export const actionsStatutsStore = () => useStatutStore(étatActuel => étatActuel.actions);
export const vueStatutsSélectionnéeStore = () => useStatutStore(étatActuel => étatActuel.vueStatutsSélectionnée);
export const statutsSélectionnésStore = () => useStatutStore(étatActuel => étatActuel.statutsSélectionnés);


