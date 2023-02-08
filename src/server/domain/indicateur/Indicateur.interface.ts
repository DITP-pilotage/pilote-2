export const typesIndicateur = ['IMPACT', 'DEPL', 'Q_SERV', 'REBOND', 'CONTEXTE', null] as const;

export type TypeIndicateur = typeof typesIndicateur[number];
export type Valeur = number | null;
export type Taux = number | null;

export default interface Indicateur {
  id: string;
  nom: string;
  type: TypeIndicateur;
  estIndicateurDuBaromètre: boolean | null;
  valeurInitiale: Valeur;
  valeurActuelle: Valeur;
  valeurCible: Valeur;
  tauxAvancementGlobal: Taux;
  evolutionValeurActuelle: number[];
}
