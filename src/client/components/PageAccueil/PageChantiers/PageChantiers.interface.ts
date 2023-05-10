import Chantier from '@/server/domain/chantier/Chantier.interface';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';

export default interface PageChantiersProps {
  chantiers: Chantier[]
  habilitation: Habilitation
}
