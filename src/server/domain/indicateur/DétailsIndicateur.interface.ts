import Avancement from '@/server/domain/chantier/avancement/Avancement.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import Indicateur from './Indicateur.interface';

export type DétailsIndicateurTerritoire = Record<CodeInsee, DétailsIndicateur>;
export type DétailsIndicateurMailles = Record<Maille, DétailsIndicateurTerritoire>;
export type DétailsIndicateurs = Record<Indicateur['id'], DétailsIndicateurTerritoire>;

export type DétailsIndicateur = {
  codeInsee: string,
  valeurInitiale: number | null,
  dateValeurInitiale: string | null,
  valeurs: number[],
  dateValeurs: string[],
  valeurActuelle: number | null,
  dateValeurActuelle: string | null,
  valeurCible: number | null,
  dateValeurCible: string | null,
  valeurCibleAnnuelle: number | null,
  dateValeurCibleAnnuelle: string | null,
  avancement: Avancement,
  unité: string | null,
  est_applicable: boolean | null,
  dateImport: string | null,
  pondération: number | null,
  prochaineDateMaj: string | null,
  prochaineDateMajJours: number | null,
  estAJour: boolean | null,
};
