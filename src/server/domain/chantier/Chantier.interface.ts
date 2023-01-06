import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import Météo from './Météo.interface';

export type Axe = { id: string, nom: string } | null;

export type Avancement = {
  global: number | null
  annuel: number | null
};

export type Maille = 'nationale' | 'régionale' | 'départementale';

export type Territoire = {
  codeInsee: string,
  avancement: Avancement,
};

export type Territoires = Record<string, Territoire>;

export default interface Chantier {
  id: string;
  nom: string;
  axe: Axe;
  nomPPG: string | null;
  périmètreIds: string[];
  mailles: Record<Maille, Territoires>;
  météo: Météo;
  avancement: Avancement;
  indicateurs: Indicateur[];
}
