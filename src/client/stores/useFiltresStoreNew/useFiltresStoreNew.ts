import { create } from 'zustand';

interface FiltreAccueil {
  perimetres: string[]
  axes: string[]
  maille: string
  groupeParMinistere: boolean
  estBarometre: boolean
  estTerritorialise: boolean
  estEnAlerteTauxAvancementNonCalculé: boolean
  estEnAlerteÉcart: boolean
  estEnAlerteBaisseOuStagnation: boolean
  estEnAlerteDonnéesNonMàj: boolean
  estEnAlerteMétéoNonRenseignée: boolean
}

interface FiltresStore {
  filtresActifs: FiltreAccueil,
  actions: {
    sauvegarderFiltres: (filtre: Partial<FiltreAccueil>) => void
    reinitialiserFiltres: () => void
    get: () => FiltreAccueil
  }
}

const etatInitial = {
  perimetres: [] as string[],
  axes: [] as string[],
  maille: '',
  groupeParMinistere: false,
  estBarometre: false,
  estTerritorialise: false,
  estEnAlerteTauxAvancementNonCalculé: false,
  estEnAlerteÉcart: false,
  estEnAlerteBaisseOuStagnation: false,
  estEnAlerteDonnéesNonMàj: false,
};
const useFiltresStoreNew = create<FiltresStore>((set, get) => ({
  filtresActifs: etatInitial,
  actions: {
    sauvegarderFiltres: (filtre: Partial<FiltreAccueil>) => set((etatActuel) => ({
      filtresActifs: {
        ...etatActuel.filtresActifs,
        ...filtre,
      },
    })),
    reinitialiserFiltres: () => set(() => ({
      filtresActifs: etatInitial,
    })),
    get: () => get().filtresActifs,
  },
}));

// eslint-disable-next-line react-hooks/rules-of-hooks
export const sauvegarderFiltres = useFiltresStoreNew.getState().actions.sauvegarderFiltres;
export const reinitialiserFiltres = useFiltresStoreNew.getState().actions.reinitialiserFiltres;
export const getFiltresActifs = useFiltresStoreNew.getState().actions.get;

