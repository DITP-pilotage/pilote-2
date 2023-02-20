import { MailleInterne } from '@/server/domain/chantier/Chantier.interface';
import { NuancierRemplissage } from '@/client/constants/nuanciers/nuancier';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';

export type CartographieTerritoireSurvolé = {
  libellé: string
  valeurAffichée: string
};

export type CartographieTerritoireCodeInsee = string;
export type CartographieValeur = string;

export type CartographieTerritoire = {
  codeInsee: CodeInsee
  tracéSVG: string;
  remplissage: string,
  libellé: string,
  valeurAffichée: string,
};

export type CartographieTerritoireAffiché = {
  codeInsee: CartographieTerritoireCodeInsee,
  maille: 'nationale' | 'régionale',
};

export type CartographieTerritoires = { 
  territoires: CartographieTerritoire[]
  frontières: { codeInsee: CodeInsee, tracéSVG: string }[]
};

export type CartographieOptions = {
  territoireAffiché: CartographieTerritoireAffiché,
  déterminerRemplissage: (valeur: CartographieValeur) => NuancierRemplissage,
  formaterValeur: (valeur: CartographieValeur) => string,
  territoireSélectionnable: boolean,
};

export type CartographieDonnées = Record<MailleInterne, Record<CartographieTerritoireCodeInsee, CartographieValeur>>;
