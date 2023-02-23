import { Maille } from '@/server/domain/chantier/Chantier.interface';


export type EvolutionIndicateur = {
  valeurCible: number | null,
  maille: Maille,
  codeInsee: string,
  évolutionValeurActuelle: number[],
  évolutionDateValeurActuelle: string[],
};
