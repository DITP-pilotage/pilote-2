import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface';
import ChantierInfo from '@/server/domain/chantier/ChantierInfo.interface';

export default interface PageChantiersProps {
  chantiers: ChantierInfo[]
  périmètresMinistériels: PérimètreMinistériel[]
}
