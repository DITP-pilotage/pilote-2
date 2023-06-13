/* eslint-disable react-hooks/rules-of-hooks */
import { create } from 'zustand';
import TypeDeRéformeStore from './useTypedeRéformeStore.interface';

const useTypeDeRéformeStore = create<TypeDeRéformeStore>((set, get) => ({
  typeDeRéformeSélectionnée: 'chantier',
  actions: {
    modifierTypeDeRéformeSélectionnée: () => {
      if (get().typeDeRéformeSélectionnée === 'chantier') {
        set({ typeDeRéformeSélectionnée: 'projet structurant' });
      } else if (get().typeDeRéformeSélectionnée === 'projet structurant') {
        set({ typeDeRéformeSélectionnée: 'chantier' });
      }
    },
  },
}));

export const typeDeRéformeSélectionnée = () => useTypeDeRéformeStore(étatActuel => étatActuel.typeDeRéformeSélectionnée);
export const actionsTypeDeRéformeStore = () => useTypeDeRéformeStore(étatActuel => étatActuel.actions);
