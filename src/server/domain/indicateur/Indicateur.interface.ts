import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';

export const typesIndicateur = ['IMPACT', 'DEPL', 'Q_SERV', 'REBOND', 'CONTEXTE', null] as const;

export type TypeIndicateur = typeof typesIndicateur[number];
export type Valeur = number | null;
export type Taux = number | null;

export type CartographieIndicateurTerritorialisée = {
  avancementAnnuel: number | null,
  valeurActuelle: number | null,
};

export type CartographieIndicateur = Record<CodeInsee, CartographieIndicateurTerritorialisée>;

export default interface Indicateur {
  id: string;
  nom: string;
  type: TypeIndicateur;
  estIndicateurDuBaromètre: boolean | null;
  description: string | null;
  source: string | null;
}
