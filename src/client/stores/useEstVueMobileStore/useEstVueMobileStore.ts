/* eslint-disable react-hooks/rules-of-hooks */
import { create } from 'zustand';
import EstVueMobileStore from './useEstVueMobileStore.interface';

const useEstVueMobileStore = create<EstVueMobileStore>((set) => ({
  estVueMobile: null,
  actions: {
    modifierEstVueMobile: estVueMobile => set({ estVueMobile }),
  },
}));

export const actionsEstVueMobileStore = () => useEstVueMobileStore(étatActuel => étatActuel.actions);
export const estVueMobileStore = () => useEstVueMobileStore(étatActuel => étatActuel.estVueMobile);
