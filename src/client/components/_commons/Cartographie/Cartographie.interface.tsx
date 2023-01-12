import { Maille } from '@/server/domain/chantier/Chantier.interface';
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
  codeInsee: Exclude<CartographieTerritoireCodeInsee, 'FR'>,
  divisionAdministrative: 'région',
} | {
  codeInsee: 'FR',
  divisionAdministrative: 'france'
};

export type CartographieDonnées = Record<Exclude<Maille, 'nationale'>, Record<CartographieTerritoireCodeInsee, CartographieValeur>>;

export default interface CartographieProps {
  données: CartographieDonnées,
  territoireAffiché: CartographieTerritoireAffiché,
  niveauDeMailleAffiché: 'régionale' | 'départementale',
}
