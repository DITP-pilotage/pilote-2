/* eslint-disable react-hooks/rules-of-hooks */
import { create } from 'zustand';
import TypeDeRéformeStore from './useTypedeRéformeStore.interface';

const useTypeDeRéformeStore = create<TypeDeRéformeStore>((set, get) => ({
  typeDeRéformeSélectionné: 'chantier',
  actions: {
    modifierTypeDeRéformeSélectionné: () => {
      if (get().typeDeRéformeSélectionné === 'chantier') {
        set({ typeDeRéformeSélectionné: 'projet structurant' });
      } else if (get().typeDeRéformeSélectionné === 'projet structurant') {
        set({ typeDeRéformeSélectionné: 'chantier' });
      }
    },
  },
}));

export const typeDeRéformeSélectionnéeStore = () => useTypeDeRéformeStore(étatActuel => étatActuel.typeDeRéformeSélectionné);
export const actionsTypeDeRéformeStore = () => useTypeDeRéformeStore(étatActuel => étatActuel.actions);
