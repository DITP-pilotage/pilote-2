import Avancement from '@/server/domain/avancement/Avancement.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import Indicateur from './Indicateur.interface';

export type DétailsIndicateurs = Record<Indicateur['id'], Record<CodeInsee, DétailsIndicateur>>;

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
