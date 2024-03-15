import {
  CartographieDonnéesAvancement,
} from '@/components/_commons/Cartographie/CartographieAvancement/CartographieAvancement.interface';
import {
  CartographieDonnéesMétéo,
} from '@/components/_commons/Cartographie/CartographieMétéo/CartographieMétéo.interface';

interface IndicateurFicheConducteurContrat {
  nom: string
  type: string | null
  valeurInitiale: string
  valeurActuelle: string
  dateValeurActuelle: string
  objectifValeurCibleIntermediaire: string
  objectifTauxAvancementIntermediaire: string
  objectifValeurCible: string
  objectifTauxAvancement: string
}

export interface ChantierFicheConducteurContrat {
  nom: string
  directeursAdministrationCentrale: string
  directeursProjet: string
  derniereValeurInitiale: string | null
  indicateurs: IndicateurFicheConducteurContrat[]
}

export interface AvancementFicheConducteurContrat {
  global: number | null
  minimum: number | null
  mediane: number | null
  maximum: number | null
}

export interface SyntheseDesResultatsContrat {
  meteo: 'ORAGE' | 'NUAGE' | 'COUVERT' | 'SOLEIL' | 'NON_NECESSAIRE' | 'NON_RENSEIGNEE' | null
  commentaire: string | null
}

export interface DonnéesCartographieContrat {
  tauxAvancement: CartographieDonnéesAvancement
  meteo: CartographieDonnéesMétéo
}

export interface ObjectifContrat {
  libellé: string
  valeur: string
}


export interface FicheConducteurContrat {
  chantier: ChantierFicheConducteurContrat
  avancement: AvancementFicheConducteurContrat
  synthèseDesRésultats: SyntheseDesResultatsContrat
  donnéesCartographie: DonnéesCartographieContrat
  objectifs: ObjectifContrat[]
}
