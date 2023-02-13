/* eslint-disable react-hooks/rules-of-hooks */
import { create } from 'zustand';
import SélecteursPageChantiersStore from './useSélecteursPageChantiersStore.interface';

const périmètreGéographiqueInitial = {
  codeInsee: 'FR',
  maille: 'nationale' as const,
};

const useSélecteursPageChantiersStore = create<SélecteursPageChantiersStore>((set) => ({
  mailleInterne: 'départementale',
  périmètreGéographique: périmètreGéographiqueInitial,
  setMailleInterne: (nouveauMailleInterne) => set(() => ({ mailleInterne: nouveauMailleInterne })),
  setPérimètreGéographique: (nouveauPérimètreGéographique) => set(() => ({ périmètreGéographique: nouveauPérimètreGéographique })),
  réinitialisePérimètreGéographique: () => set(() => ({ périmètreGéographique: périmètreGéographiqueInitial })),
}));

export const mailleInterne = () => useSélecteursPageChantiersStore(étatActuel => étatActuel.mailleInterne);
export const setMailleInterne = () => useSélecteursPageChantiersStore(étatActuel => étatActuel.setMailleInterne);

export const périmètreGéographique = () => useSélecteursPageChantiersStore(étatActuel => étatActuel.périmètreGéographique);
export const setPérimètreGéographique = () => useSélecteursPageChantiersStore(étatActuel => étatActuel.setPérimètreGéographique);
export const réinitialisePérimètreGéographique = () => useSélecteursPageChantiersStore(étatActuel => étatActuel.réinitialisePérimètreGéographique);
