import Axe from '@/server/domain/axe/Axe.interface';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import Ministère from '@/server/domain/ministère/Ministère.interface';
import Ppg from '@/server/domain/ppg/Ppg.interface';
import ProjetStructurant from '@/server/domain/projetStructurant/ProjetStructurant.interface';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';

export default interface PageAccueilProps {
  chantiers: Chantier[]
  projetsStructurants: ProjetStructurant[]
  ministères: Ministère[]
  axes: Axe[],
  ppgs: Ppg[],
  habilitations: Habilitations,
}
