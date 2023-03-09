import { Maille } from '@/server/domain/maille/Maille.interface';
import { Territoires } from '@/server/domain/territoire/Territoire.interface';
import Axe from '@/server/domain/axe/Axe.interface';
import Ppg from '@/server/domain/ppg/Ppg.interface';

export type DirecteurAdministrationCentrale = { nom: string, direction: string };
export type Contact = { nom: string, email: string | null };

export default interface Chantier {
  id: string;
  nom: string;
  axe: Axe['nom'];
  ppg: Ppg['nom'];
  périmètreIds: string[];
  mailles: Record<Maille, Territoires>;
  responsables: {
    porteur: string,
    coporteurs: string[],
    directeursAdminCentrale: DirecteurAdministrationCentrale[],
    directeursProjet: Contact[]
  }
  estBaromètre: boolean;
  estTerritorialisé: boolean;
}
