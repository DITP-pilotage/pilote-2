/* eslint-disable react-hooks/rules-of-hooks */
import create from 'zustand';
import NiveauDeMailleStore from './useNiveauDeMailleStore.interface';

const useNiveauDeMailleStore = create<NiveauDeMailleStore>((set) => ({
  niveauDeMaille: 'départementale',
  setNiveauDeMaille: (nouveauNiveauDeMaille) => set(() => ({ niveauDeMaille: nouveauNiveauDeMaille })),
}));

export const niveauDeMaille = () => useNiveauDeMailleStore((étatActuel) => étatActuel.niveauDeMaille);
export const setNiveauDeMaille = () => useNiveauDeMailleStore((étatActuel) => étatActuel.setNiveauDeMaille);

