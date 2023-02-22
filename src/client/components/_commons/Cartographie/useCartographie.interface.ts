import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';

export type CartographieInfoBulle = {
  libellé: string
  valeurAffichée: string
};

export type CartographieTerritoire = {
  codeInsee: CodeInsee
  tracéSVG: string;
  remplissage: string,
  libellé: string,
  valeurAffichée: string,
};

export type CartographieTerritoireAffiché = {
  codeInsee: CodeInsee,
  maille: 'nationale' | 'régionale',
};

export type CartographieTerritoires = { 
  territoires: CartographieTerritoire[]
  frontières: { codeInsee: CodeInsee, tracéSVG: string }[]
};

export type CartographieOptions = {
  territoireAffiché: CartographieTerritoireAffiché,
  territoireSélectionnable: boolean,
};
