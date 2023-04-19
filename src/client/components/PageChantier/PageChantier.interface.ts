import { Habilitation } from '@/server/domain/identité/Habilitation';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';

export default interface PageChantierProps {
  indicateurs: Indicateur[]
  habilitation: Habilitation
}
