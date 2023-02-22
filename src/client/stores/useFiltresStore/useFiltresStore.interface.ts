import PérimètreMinistériel from '@/server/domain/ministère/PérimètreMinistériel.interface';
import { Axe, Ppg } from '@/server/domain/chantier/Chantier.interface';

export type FiltreCatégorie = keyof FiltresActifs;

type AutresFiltres = { id: string, attribut: string, nom: string };

export type Filtre = PérimètreMinistériel | AutresFiltres | Ppg | Axe;

export interface FiltreCatégorieTuple {
  catégorie: FiltreCatégorie,
  filtre: Filtre,
}

export interface FiltresActifs {
  périmètresMinistériels: PérimètreMinistériel[],
  axes: Axe[],
  ppg: Ppg[],
  autresFiltres: AutresFiltres[],
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
