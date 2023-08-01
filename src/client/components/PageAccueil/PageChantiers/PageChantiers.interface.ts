import Chantier from '@/server/domain/chantier/Chantier.interface';
import Ministère from '@/server/domain/ministère/Ministère.interface';

export default interface PageChantiersProps {
  chantiers: Chantier[],
  ministères: Ministère[]
}
