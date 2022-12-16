import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/périmètreMinistériel.interface';

export type Catégorie = keyof FiltresActifs;

export type Filtre = {
  id: PérimètreMinistériel['id'],
  nom: PérimètreMinistériel['nom']
};

export interface FiltreCatégorieTuple {
  catégorie: Catégorie,
  filtre: Filtre,
}

export interface FiltresActifs {
  périmètresMinistériels: Filtre[]
}

export default interface FiltresStore {
  filtresActifs: FiltresActifs
  actions: {
    activerUnFiltre: (filtre: Filtre, catégorieDeFiltre: keyof FiltresActifs) => void
    désactiverUnFiltre: (id: Filtre['id'], catégorieDeFiltre: keyof FiltresActifs) => void
    désactiverTousLesFiltres: () => void
    estActif: (id: Filtre['id'], catégorieDeFiltre: keyof FiltresActifs) => boolean
    récupérerFiltresActifsDUneCatégorie: (catégorieDeFiltre: keyof FiltresActifs) => Filtre[]
    récupérerNombreFiltresActifsDUneCatégorie: (catégorieDeFiltre: keyof FiltresActifs) => number
    récupérerNombreFiltresActifs: () => number
    récupérerCatégories: () => Catégorie[]
    récupérerFiltresActifsAvecLeursCatégories: () => FiltreCatégorieTuple[]
  }
}
