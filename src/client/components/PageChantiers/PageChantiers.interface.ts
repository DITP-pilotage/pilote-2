import Chantier from '@/server/domain/chantier/Chantier.interface';
import { Ministère } from '@/components/PageChantiers/BarreLatérale/FiltresMinistères/FiltresMinistères.interface';

export default interface PageChantiersProps {
  chantiers: Chantier[]
  ministères: Ministère[]
}
