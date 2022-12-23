import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import ChantierAvancement from './ChantierAvancement.interface';
import Météo from './Météo.interface';
export type Axe = { id: string, nom: string } | null;

export default interface Chantier {
  id: string;
  nom: string;
  axe: Axe;
  nomPPG: string | null;
  id_périmètre: string;
  perimètreIds: string[];
  zoneNom: string;
  codeInsee: string;
  météo: Météo;
  avancement: ChantierAvancement;
  indicateurs: Indicateur[];
}
