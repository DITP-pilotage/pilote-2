import Axe from '@/server/domain/axe/Axe.interface';
import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface';

export type FiltreCatégorie = keyof FiltresActifs;

export type FiltreTypologieType = { id: string, attribut: 'estBaromètre' | 'estTerritorialisé', nom: string };

export type FiltreAlerte = { id: 'estEnAlerteÉcart' | 'estEnAlerteBaisse' | 'estEnAlerteDonnéesNonMàj' | 'estEnAlerteTauxAvancementNonCalculé' | 'estEnAlerteMétéoNonRenseignée', nom: string };

export type Filtre = PérimètreMinistériel | FiltreTypologieType | Axe | FiltreAlerte;

export interface FiltreCatégorieTuple {
  catégorie: FiltreCatégorie,
  filtre: Filtre,
}

export interface FiltresActifs {
  périmètresMinistériels: PérimètreMinistériel[],
  axes: Axe[],
  filtresTypologie: FiltreTypologieType[],
  filtresAlerte: FiltreAlerte[],
}

export default interface FiltresStore {
  filtresActifs: FiltresActifs
  actions: {
    activerUnFiltre: (filtre: Filtre, catégorieDeFiltre: FiltreCatégorie) => void
    changerÉtatDuFiltre: (filtre: Filtre, catégorieDeFiltre: FiltreCatégorie) => void
    désactiverUnFiltre: (id: Filtre['id'], catégorieDeFiltre: FiltreCatégorie) => void
    désactiverTousLesFiltres: () => void
    estActif: (id: Filtre['id'], catégorieDeFiltre: FiltreCatégorie) => boolean
    récupérerFiltresActifsDUneCatégorie: (catégorieDeFiltre: FiltreCatégorie) => Filtre[]
    récupérerNombreFiltresActifsDUneCatégorie: (catégorieDeFiltre: FiltreCatégorie) => number
    récupérerNombreFiltresActifs: () => number
    récupérerCatégories: () => FiltreCatégorie[]
    récupérerFiltresActifsAvecLeursCatégories: () => FiltreCatégorieTuple[]
  }
}
