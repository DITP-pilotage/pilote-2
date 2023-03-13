import Avancement from '@/server/domain/avancement/Avancement.interface';


export type FichesIndicateurs = Record<IdIndicateur, Record<CodeInsee, DétailsIndicateur>>;

type IdIndicateur = string;

type CodeInsee = string;

export type DétailsIndicateur = {
  codeInsee: string,
  valeurInitiale: number | null,
  dateValeurInitiale: string | null,
  valeurs: number[],
  dateValeurs: string[],
  valeurCible: number | null,
  avancement: Avancement,
};
