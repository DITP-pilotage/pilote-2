/* eslint-disable react-hooks/rules-of-hooks */
import create from 'zustand';
import NiveauDeMailleStore from './useSélecteursPageChantiersStore.interface';

const useSélecteursPageChantiersStore = create<NiveauDeMailleStore>((set) => ({
  niveauDeMaille: 'départementale',
  périmètreGéographique: {
    codeInsee: 'FR',
    maille: 'nationale',
  },
  setNiveauDeMaille: (nouveauNiveauDeMaille) => set(() => ({ niveauDeMaille: nouveauNiveauDeMaille })),
  setPérimètreGéographique: (nouveauPérimètreGéographique) => set(() => ({ périmètreGéographique: nouveauPérimètreGéographique })),
}));

export const niveauDeMaille = () => useSélecteursPageChantiersStore((étatActuel) => étatActuel.niveauDeMaille);
export const setNiveauDeMaille = () => useSélecteursPageChantiersStore((étatActuel) => étatActuel.setNiveauDeMaille);

export const périmètreGéographique = () => useSélecteursPageChantiersStore((étatActuel) => étatActuel.périmètreGéographique);
export const setPérimètreGéographique = () => useSélecteursPageChantiersStore((étatActuel) => étatActuel.setPérimètreGéographique);
