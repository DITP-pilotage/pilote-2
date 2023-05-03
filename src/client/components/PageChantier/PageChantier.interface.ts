import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';

export default interface PageChantierProps {
  indicateurs: Indicateur[]
  habilitations: Habilitations
}
