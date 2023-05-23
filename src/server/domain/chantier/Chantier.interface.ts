import { Maille } from '@/server/domain/maille/Maille.interface';
import { Territoires } from '@/server/domain/territoire/Territoire.interface';
import Axe from '@/server/domain/axe/Axe.interface';
import Ppg from '@/server/domain/ppg/Ppg.interface';
import Ministère from '@/server/domain/ministère/Ministère.interface';

export type DirecteurAdministrationCentrale = { nom: string, direction: string };
export type DirecteurProjet = { nom: string, email: string | null };

export default interface Chantier {
  id: string;
  nom: string;
  axe: Axe['nom'];
  ppg: Ppg['nom'];
  périmètreIds: string[];
  mailles: Record<Maille, Territoires>;
  responsables: {
    porteur: Ministère,
    coporteurs: Ministère[],
    directeursAdminCentrale: DirecteurAdministrationCentrale[],
    directeursProjet: DirecteurProjet[]
  }
  estBaromètre: boolean;
  estTerritorialisé: boolean;
}
