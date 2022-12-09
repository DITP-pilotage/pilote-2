import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/périmètreMinistériel.interface';
import ChantierFront from '@/client/interfaces/ChantierFront.interface';

export default interface PageChantiersProps {
  chantiers: ChantierFront[]
  périmètresMinistériels: PérimètreMinistériel[]
}
