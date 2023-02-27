import { Maille } from '@/server/domain/maille/Maille.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import Avancement from '@/server/domain/avancement/Avancement.interface';

export const typesIndicateur = ['IMPACT', 'DEPL', 'Q_SERV', 'REBOND', 'CONTEXTE', null] as const;

export type TypeIndicateur = typeof typesIndicateur[number];
export type Valeur = number | null;
export type Taux = number | null;

export type IndicateurTerritorialisé = {
  codeInsee: CodeInsee,
  valeurInitiale: Valeur;
  valeurActuelle: Valeur;
  valeurCible: Valeur;
  dateValeurInitiale: string | null;
  dateValeurActuelle: string | null;
  tauxAvancementGlobal: Taux;
  evolutionValeurActuelle: number[];
  evolutionDateValeurActuelle: string[];
};

export type IndicateurMétriques = {
  valeurInitiale: number | null,
  valeurActuelle: number | null,
  valeurCible: number | null,
  dateValeurInitiale: string | null;
  dateValeurActuelle: string | null;
  avancement: Avancement,
};

export type IndicateursMétriques = Record<string, IndicateurMétriques>;

export type IndicateurDonnéesTerritoires = Record<string, IndicateurTerritorialisé>;

export default interface Indicateur {
  id: string;
  nom: string;
  type: TypeIndicateur;
  estIndicateurDuBaromètre: boolean | null;
  mailles: Record<Maille, IndicateurDonnéesTerritoires>;
}
