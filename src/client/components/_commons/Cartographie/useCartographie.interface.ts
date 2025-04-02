import { ReactNode } from 'react';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';

export type CartographieTerritoire = {
  codeInsee: CodeInsee
  code: string
  remplissage: string,
  libellé: string,
  contenuInfoBulle: ReactNode
  estInteractif: boolean
  estApplicable: boolean | null
};

export type CartographieTerritoireAffiché = {
  codeInsee: CodeInsee,
  maille: 'nationale' | 'regionale',
};

export type CartographieTerritoires = {
  territoires: CartographieTerritoire[]
  frontières: { codeInsee: CodeInsee; code: string }[]
};

export type CartographieOptions = {
  territoireAffiché: CartographieTerritoireAffiché,
  territoireSélectionnable: boolean,
  multiséléction: boolean,
  estInteractif: boolean,
  hasTooltip?: boolean
};
