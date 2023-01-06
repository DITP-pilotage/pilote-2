import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface';
import Chantier from '@/server/domain/chantier/Chantier.interface';

export default interface PageChantiersProps {
  chantiers: Chantier[]
  périmètresMinistériels: PérimètreMinistériel[]
}
