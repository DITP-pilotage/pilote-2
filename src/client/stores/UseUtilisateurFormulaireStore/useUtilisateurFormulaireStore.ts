/* eslint-disable react-hooks/rules-of-hooks */
import { create } from 'zustand';
import UtilisateurFormulaireStore from '@/stores/UseUtilisateurFormulaireStore/useUtilisateurFormulaireStore.interface';

const useUtilisateurFormulaireStore = create<UtilisateurFormulaireStore>((set) => ({
  infosDeBase: null,
  actions: {
    modifierInfosDeBase: infosDeBase => set({ infosDeBase }),
  },
}));

export const actionsUtilisateurFormulaireStore = () => useUtilisateurFormulaireStore(étatActuel => étatActuel.actions);
export const utilisateurFormulaireStore = () => useUtilisateurFormulaireStore(étatActuel => étatActuel.infosDeBase);
