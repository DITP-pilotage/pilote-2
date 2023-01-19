/* eslint-disable react-hooks/rules-of-hooks */
import create from 'zustand';
import NiveauDeMailleStore from './useNiveauDeMailleStore.interface';

const useNiveauDeMailleStore = create<NiveauDeMailleStore>((set) => ({
  niveauDeMaille: 'départementale',
  périmètreGéographique: {
    codeInsee: 'FR',
    maille: 'nationale',
  },
  setNiveauDeMaille: (nouveauNiveauDeMaille) => set(() => ({ niveauDeMaille: nouveauNiveauDeMaille })),
  setPérimètreGéographique: (nouveauPérimètreGéographique) => set(() => ({ périmètreGéographique: nouveauPérimètreGéographique })),
}));

export const niveauDeMaille = () => useNiveauDeMailleStore((étatActuel) => étatActuel.niveauDeMaille);
export const setNiveauDeMaille = () => useNiveauDeMailleStore((étatActuel) => étatActuel.setNiveauDeMaille);

export const périmètreGéographique = () => useNiveauDeMailleStore((étatActuel) => étatActuel.périmètreGéographique);
export const setPérimètreGéographique = () => useNiveauDeMailleStore((étatActuel) => étatActuel.setPérimètreGéographique);
