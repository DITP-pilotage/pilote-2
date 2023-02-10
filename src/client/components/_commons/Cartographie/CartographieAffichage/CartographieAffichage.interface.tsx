import { ReactNode } from 'react';
import { Maille } from '@/server/domain/chantier/Chantier.interface';
import { NuancierRemplissage } from '@/client/constants/nuanciers/nuancier';
import { NiveauDeMaille } from '@/client/stores/useSélecteursPageChantiersStore/useSélecteursPageChantiersStore.interface';

export type CartographieRégionJSON = {
  tracéSVG: string,
  codeInsee: CartographieTerritoireCodeInsee,
  nom: string
};

export type CartographieDépartementJSON = {
  tracéSVG: string,
  codeInsee: CartographieTerritoireCodeInsee,
  codeInseeRégion: CartographieTerritoireCodeInsee,
  nom: string
};

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

export type CartographieDonnées = Record<NiveauDeMaille, Record<CartographieTerritoireCodeInsee, CartographieValeur>>;

export default interface CartographieAffichageProps {
  children?: ReactNode,
  options?: Partial<CartographieOptions>,
  données: CartographieDonnées,
  niveauDeMaille: NiveauDeMaille,
}
