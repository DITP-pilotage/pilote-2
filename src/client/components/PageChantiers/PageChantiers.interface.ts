import Chantier from '@/server/domain/chantier/Chantier.interface';
import Ministère from '@/server/domain/ministère/Ministère.interface';
import { Axe } from '../../../pages';

export default interface PageChantiersProps {
  chantiers: Chantier[]
  ministères: Ministère[]
  axes: Axe[],
}
