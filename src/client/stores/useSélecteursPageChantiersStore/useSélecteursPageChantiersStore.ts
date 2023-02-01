/* eslint-disable react-hooks/rules-of-hooks */
import { create } from 'zustand';
import SélecteursPageChantiersStore from './useSélecteursPageChantiersStore.interface';

const périmètreGéographiqueInitial = {
  codeInsee: 'FR',
  maille: 'nationale' as const,
};

const useSélecteursPageChantiersStore = create<SélecteursPageChantiersStore>((set) => ({
  niveauDeMaille: 'départementale',
  périmètreGéographique: périmètreGéographiqueInitial,
  setNiveauDeMaille: (nouveauNiveauDeMaille) => set(() => ({ niveauDeMaille: nouveauNiveauDeMaille })),
  setPérimètreGéographique: (nouveauPérimètreGéographique) => set(() => ({ périmètreGéographique: nouveauPérimètreGéographique })),
  réinitialisePérimètreGéographique: () => set(() => ({ périmètreGéographique: périmètreGéographiqueInitial })),
}));

export const niveauDeMaille = () => useSélecteursPageChantiersStore(étatActuel => étatActuel.niveauDeMaille);
export const setNiveauDeMaille = () => useSélecteursPageChantiersStore(étatActuel => étatActuel.setNiveauDeMaille);

export const périmètreGéographique = () => useSélecteursPageChantiersStore(étatActuel => étatActuel.périmètreGéographique);
export const setPérimètreGéographique = () => useSélecteursPageChantiersStore(étatActuel => étatActuel.setPérimètreGéographique);
export const réinitialisePérimètreGéographique = () => useSélecteursPageChantiersStore(étatActuel => étatActuel.réinitialisePérimètreGéographique);
