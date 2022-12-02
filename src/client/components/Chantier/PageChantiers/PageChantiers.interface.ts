import Chantier from 'server/domain/chantier/chantier.interface';
import PérimètreMinistériel from 'server/domain/périmètreMinistériel/périmètreMinistériel.interface';

export default interface PageChantiersProps {
  chantiers: Chantier[]
  périmètresMinistériels: PérimètreMinistériel[]
}