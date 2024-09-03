import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';

export type CartographieInfoBulle = {
  libellé: string
  valeurAffichée: string
};

export type CartographieTerritoire = {
  codeInsee: CodeInsee
  // code // Rajouter le code du territoire pour faire le mapping avec le chemin SVG qui est dans le svg source. Si le code insee n'est pas le code territoire.
  tracéSVG: string;
  remplissage: string,
  libellé: string,
  valeurAffichée: string,
  estInteractif: boolean
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
  multiséléction: boolean,
  estInteractif: boolean
};
