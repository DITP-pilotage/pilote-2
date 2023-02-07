import { ReactNode } from 'react';
import { NiveauDeMaille } from '@/stores/useSélecteursPageChantiersStore/useSélecteursPageChantiersStore.interface';
import { NuancierRemplissage } from '@/client/constants/nuanciers/nuancier';
import { CartographieTerritoireCodeInsee, CartographieValeur } from './CartographieAffichage/CartographieAffichage.interface';

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

export type CartographieTerritoireAffiché = {
  codeInsee: CartographieTerritoireCodeInsee,
  maille: 'nationale' | 'régionale',
};

export type CartographieDonnées = Record<NiveauDeMaille, Record<CartographieTerritoireCodeInsee, CartographieValeur>>;

export type CartographieOptions = {
  territoireAffiché: CartographieTerritoireAffiché,
  déterminerRemplissage: (valeur: CartographieValeur) => NuancierRemplissage,
  formaterValeur: (valeur: CartographieValeur) => string,
  territoireSélectionnable: boolean,
};
export default interface CartographieProps {
  children?: ReactNode,
  données: CartographieDonnées,
  options?: Partial<CartographieOptions>,
  niveauDeMaille: NiveauDeMaille,
}
