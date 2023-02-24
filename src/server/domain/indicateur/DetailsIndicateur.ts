import { Avancement } from '@/server/domain/chantier/Chantier.interface';


export type FichesIndicateur = Record<IdIndicateur, Record<CodeInsee, DetailsIndicateur>>;

type IdIndicateur = string;

type CodeInsee = string;

type DetailsIndicateur = {
  codeInsee: string,
  valeurInitiale: number | null,
  valeurs: number[],
  dateValeurs: string[],
  valeurCible: number | null,
  avancement: Avancement,
};
