import Avancement from '@/server/domain/chantier/avancement/Avancement.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import Indicateur from './Indicateur.interface';

export type DétailsIndicateurCodeInsee = Record<CodeInsee, DétailsIndicateur>;
export type DétailsIndicateurTerritoire = Record<Maille, DétailsIndicateurCodeInsee>;
export type DétailsIndicateurs = Record<Indicateur['id'], DétailsIndicateurCodeInsee>;

export type DétailsIndicateur = {
  codeInsee: string,
  valeurInitiale: number | null,
  dateValeurInitiale: string | null,
  valeurs: number[],
  dateValeurs: string[],
  valeurCible: number | null,
  dateValeurCible: string | null,
  avancement: Avancement,
};
