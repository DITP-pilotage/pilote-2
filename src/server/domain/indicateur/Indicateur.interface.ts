export const typesAvancement = ['CONTEXTE', 'DÉPLOIEMENT', 'IMPACT', 'QUALITÉ_DE_SERVICE', 'SUIVI_EXTERNALITÉS_ET_EFFET_REBOND', null] as const;

export type TypesAvancement = typeof typesAvancement[number];
export type Valeur = number | null;
export type Taux = number | null;

export default interface Indicateur {
  id: string;
  nom: string;
  type: TypesAvancement;
  estIndicateurDuBaromètre: boolean | null;
  valeurInitiale: Valeur;
  valeurActuelle: Valeur;
  valeurCible: Valeur;
  tauxAvancementGlobal: Taux;
}
