import Type from './Type.interface';

export type Valeur = number | null;
export type Taux = number | null;

export default interface Indicateur {
  id: string;
  nom: string;
  type: Type;
  estIndicateurDuBaromètre: boolean;
  valeurInitiale: Valeur;
  valeurActuelle: Valeur;
  valeurCible: Valeur;
  tauxAvancementGlobal: Taux;
}
