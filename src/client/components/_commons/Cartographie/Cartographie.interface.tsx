import { ReactNode } from 'react';
import { NiveauDeMaille } from '@/client/stores/useNiveauDeMailleStore/useNiveauDeMailleStore.interface';
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
  divisionAdministrative: 'région' | 'france',
};

export type CartographieDonnées = Record<NiveauDeMaille, Record<CartographieTerritoireCodeInsee, CartographieValeur>>;

export type CartographieOptions = {
  couleurDeRemplissage: (valeur: CartographieValeur) => string,
  formaterValeur: (valeur: CartographieValeur) => string,
  territoireSélectionnable: boolean
};
export default interface CartographieProps {
  children: ReactNode,
  données: CartographieDonnées,
  options: CartographieOptions,
  territoireAffiché: CartographieTerritoireAffiché,
  niveauDeMailleAffiché: NiveauDeMaille,
}
