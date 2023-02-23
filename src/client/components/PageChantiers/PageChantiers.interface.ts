import Axe from '@/server/domain/axe/Axe.interface';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import Ministère from '@/server/domain/ministère/Ministère.interface';
import Ppg from '@/server/domain/ppg/Ppg.interface';

export default interface PageChantiersProps {
  chantiers: Chantier[]
  ministères: Ministère[]
  axes: Axe[],
  ppg: Ppg[]
}
