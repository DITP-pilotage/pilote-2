/* eslint-disable react-hooks/rules-of-hooks */
import create from 'zustand';
import FiltresStore, { Catégorie, FiltreCatégorieTuple } from './useFiltresStore.interface';

const filtresActifsInitiaux = {
  périmètresMinistériels: [],
};

const useFiltresStore = create<FiltresStore>((set, get) => ({
  filtresActifs: filtresActifsInitiaux,
  actions: {
    activerUnFiltre: (filtre, catégorieDeFiltre) => set(étatActuel => ({
      filtresActifs: {
        ...étatActuel.filtresActifs,
        [catégorieDeFiltre]: [...étatActuel.filtresActifs[catégorieDeFiltre], filtre],
      },
    })),

    désactiverUnFiltre: (filtreId, catégorieDeFiltre) => set(étatActuel => ({
      filtresActifs: {
        ...étatActuel.filtresActifs,
        [catégorieDeFiltre]: étatActuel.filtresActifs[catégorieDeFiltre].filter(filtreActif => filtreActif.id !== filtreId),
      },
    })),

    désactiverTousLesFiltres: () => set(() => ({ filtresActifs: filtresActifsInitiaux })),

    estActif: (filtreId, catégorieDeFiltre) => get().filtresActifs[catégorieDeFiltre].some(filtre => filtre.id === filtreId),

    récupérerFiltresActifsDUneCatégorie: (catégorieDeFiltre) => get().filtresActifs[catégorieDeFiltre],

    récupérerNombreFiltresActifsDUneCatégorie: (catégorieDeFiltre) => (
      get().actions.récupérerFiltresActifsDUneCatégorie(catégorieDeFiltre).length
    ),

    récupérerNombreFiltresActifs: () => (
      get().actions.récupérerFiltresActifsAvecLeursCatégories().length
    ),

    récupérerCatégories: () => Object.keys(get().filtresActifs) as Catégorie[],

    récupérerFiltresActifsAvecLeursCatégories: () => {

      let filtreEtCatégorie: FiltreCatégorieTuple[] = [];

      get().actions.récupérerCatégories().forEach(catégorie => (
        get().actions.récupérerFiltresActifsDUneCatégorie(catégorie).forEach(filtre => {
          filtreEtCatégorie.push({
            catégorie,
            filtre,
          });
        })
      ));
      return filtreEtCatégorie;
    },

  },
}));

export const actions = () => useFiltresStore(étatActuel => étatActuel.actions);
export const filtresActifs = () => useFiltresStore(étatActuel => étatActuel.filtresActifs);
