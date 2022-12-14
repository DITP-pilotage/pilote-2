import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/périmètreMinistériel.interface';
import Chantier from '@/server/domain/chantier/chantier.interface';

export default interface PageChantiersProps {
  chantiers: Chantier[]
  périmètresMinistériels: PérimètreMinistériel[]
}
