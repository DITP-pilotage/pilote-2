import { Maille } from '@/server/domain/chantier/Chantier.interface';

export type TracéRégionJSON = {
  tracéSVG: string,
  codeInsee: string,
  nom: string
}[];

export type TerritoireAffiché = {
  codeInsee: Exclude<string, 'FR'>,
  divisionAdministrative: 'région',
} | {
  codeInsee: 'FR',
  divisionAdministrative: 'france'
};

export type CartographieDonnées = Record<Exclude<Maille, 'nationale'>, Record<string, number | null>>;

export type FonctionDAffichage = (valeur: number | null) => string;

export default interface CartographieProps {
  données: CartographieDonnées,
  fonctionDAffichage: FonctionDAffichage,
  territoireAffiché: TerritoireAffiché,
  niveauDeMailleAffiché: 'régionale' | 'départementale',
}
