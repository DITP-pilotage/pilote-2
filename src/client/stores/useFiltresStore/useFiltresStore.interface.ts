import PérimètreMinistériel from '@/server/domain/ministère/PérimètreMinistériel.interface';

export type Catégorie = keyof FiltresActifs;

type AutresFiltres = { id: string, attribut: string, nom: string };

export type Filtre = PérimètreMinistériel | AutresFiltres;

export interface FiltreCatégorieTuple {
  catégorie: Catégorie,
  filtre: Filtre,
}

export interface FiltresActifs {
  périmètresMinistériels: PérimètreMinistériel[],
  autresFiltres: AutresFiltres[],
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
