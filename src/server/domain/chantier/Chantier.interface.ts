import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import Météo from './Météo.interface';

export type Axe = { id: string, nom: string } | null;
export type Avancement = {
  global: number | null
  annuel: number | null
};

export default interface Chantier {
  id: string;
  nom: string;
  axe: Axe;
  nomPPG: string | null;
  périmètreIds: string[];
  zoneNom: string;
  codeInsee: string;
  maille: string;
  météo: Météo;
  avancement: Avancement
  indicateurs: Indicateur[];
}
