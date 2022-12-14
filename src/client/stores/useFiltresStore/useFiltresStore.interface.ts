import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface';

export type Catégorie = keyof FiltresActifs;

export type FiltreId = PérimètreMinistériel['id'];

export interface FiltreCatégorieTuple {
  catégorie: Catégorie,
  filtre: FiltreId,
}

export interface FiltresActifs {
  périmètresMinistériels: FiltreId[]
}

export default interface FiltresStore {
  filtresActifs: FiltresActifs
  actions: {
    activerUnFiltre: (id: FiltreId, catégorieDeFiltre: keyof FiltresActifs) => void
    désactiverUnFiltre: (id: FiltreId, catégorieDeFiltre: keyof FiltresActifs) => void
    désactiverTousLesFiltres: () => void
    estActif: (id: FiltreId, catégorieDeFiltre: keyof FiltresActifs) => boolean
    récupérerFiltresActifsDUneCatégorie: (catégorieDeFiltre: keyof FiltresActifs) => FiltreId[]
    récupérerNombreFiltresActifsDUneCatégorie: (catégorieDeFiltre: keyof FiltresActifs) => number
    récupérerCatégories: () => Catégorie[]
    récupérerFiltresActifsAvecLeursCatégories: () => FiltreCatégorieTuple[]
  }
}
