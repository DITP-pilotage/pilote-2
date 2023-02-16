import { Maille, MailleInterne } from '@/server/domain/chantier/Chantier.interface';
import { NuancierRemplissage } from '@/client/constants/nuanciers/nuancier';

export type CartographieBulleTerritoire = Pick<CartographieTerritoire, 'codeInsee' | 'nom' | 'valeur' | 'maille'>;
export type CartographieTerritoireCodeInsee = string;
export type CartographieValeur = number | string | null;

export type CartographieTerritoire = {
  codeInsee: CartographieTerritoireCodeInsee,
  maille: Maille,
  nom: string,
  sousTerritoires: (CartographieTerritoire & {
    codeInseeParent: CartographieTerritoireCodeInsee;
  })[];
  tracéSVG: string;
  valeur: CartographieValeur,
};

export type CartographieTerritoireAffiché = {
  codeInsee: CartographieTerritoireCodeInsee,
  maille: 'nationale' | 'régionale',
};

export type CartographieOptions = {
  territoireAffiché: CartographieTerritoireAffiché,
  déterminerRemplissage: (valeur: CartographieValeur) => NuancierRemplissage,
  formaterValeur: (valeur: CartographieValeur) => string,
  territoireSélectionnable: boolean,
};

export type CartographieDonnées = Record<MailleInterne, Record<CartographieTerritoireCodeInsee, CartographieValeur>>;
