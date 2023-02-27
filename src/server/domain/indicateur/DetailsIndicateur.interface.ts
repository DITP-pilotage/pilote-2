import Avancement from '@/server/domain/avancement/Avancement.interface';


export type FichesIndicateur = Record<IdIndicateur, Record<CodeInsee, DetailsIndicateurInterface>>;

type IdIndicateur = string;

type CodeInsee = string;

type DetailsIndicateurInterface = {
  codeInsee: string,
  valeurInitiale: number | null,
  dateValeurInitiale: string | null,
  valeurs: number[],
  dateValeurs: string[],
  valeurCible: number | null,
  avancement: Avancement,
};
