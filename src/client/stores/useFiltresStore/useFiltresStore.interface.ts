import PérimètreMinistériel from '@/server/domain/ministère/PérimètreMinistériel.interface';
import { Axe } from '../../../pages';

type AutresFiltres = { id: string, attribut: string, nom: string };

export interface FiltresActifs {
  périmètresMinistériels: PérimètreMinistériel[],
  axes: Axe[],
  autresFiltres: AutresFiltres[],
}

export type FiltreCatégorie = keyof FiltresActifs;

type FiltresDUneCatégorie = FiltresActifs[FiltreCatégorie];
export type Filtre = FiltresDUneCatégorie[number];

export interface FiltreCatégorieTuple {
  catégorie: FiltreCatégorie,
  filtre: Filtre,
}

export default interface FiltresStore {
  filtresActifs: FiltresActifs
  actions: {
    activerUnFiltre: (filtre: Filtre, catégorieDeFiltre: FiltreCatégorie) => void
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
