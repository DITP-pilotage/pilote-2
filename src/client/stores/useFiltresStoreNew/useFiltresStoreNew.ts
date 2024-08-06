import { create } from 'zustand';

interface FiltreAccueil {
  territoireCode: string
  perimetres: string[]
  axes: string[]
  maille: string
  statut: string
  groupeParMinistere: boolean
  estBarometre: boolean
  estTerritorialise: boolean
  estEnAlerteTauxAvancementNonCalculé: boolean
  estEnAlerteÉcart: boolean
  estEnAlerteBaisse: boolean
  estEnAlerteMétéoNonRenseignée: boolean
  estEnAlerteAbscenceTauxAvancementDepartemental: boolean
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
  territoireCode: '',
  maille: '',
  statut: 'PUBLIE',
  groupeParMinistere: false,
  estBarometre: false,
  estTerritorialise: false,
  estEnAlerteTauxAvancementNonCalculé: false,
  estEnAlerteÉcart: false,
  estEnAlerteBaisse: false,
  estEnAlerteMétéoNonRenseignée: false,
  estEnAlerteAbscenceTauxAvancementDepartemental: false,
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

