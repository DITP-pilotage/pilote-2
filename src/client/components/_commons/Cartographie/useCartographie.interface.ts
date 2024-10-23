import { ReactNode } from 'react';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';

export type CartographieInfoBulle = {
  libellé: string
  contenu: ReactNode
};

export type CartographieTerritoire = {
  codeInsee: CodeInsee
  code: string
  remplissage: string,
  libellé: string,
  contenuInfoBulle: ReactNode
  estInteractif: boolean
};

export type CartographieTerritoireAffiché = {
  codeInsee: CodeInsee,
  maille: 'nationale' | 'régionale',
};

export type CartographieTerritoires = {
  territoires: CartographieTerritoire[]
  frontières: { codeInsee: CodeInsee; code: string }[]
};

export type CartographieOptions = {
  territoireAffiché: CartographieTerritoireAffiché,
  territoireSélectionnable: boolean,
  multiséléction: boolean,
  estInteractif: boolean
};
