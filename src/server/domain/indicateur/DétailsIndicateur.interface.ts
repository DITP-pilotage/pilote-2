import Avancement from '@/server/domain/avancement/Avancement.interface';
import Indicateur from './Indicateur.interface';
import { CodeInsee } from '../territoire/Territoire.interface';

export type DétailsIndicateurs = Record<Indicateur['id'], Record<CodeInsee, DétailsIndicateur>>;

export type DétailsIndicateur = {
  codeInsee: string,
  valeurInitiale: number | null,
  dateValeurInitiale: string | null,
  valeurs: number[],
  dateValeurs: string[],
  valeurCible: number | null,
  avancement: Avancement,
};
