import Chantier from '@/server/domain/chantier/Chantier.interface';
import { Habilitation } from '@/server/domain/identité/Habilitation';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';

export default interface PageChantierProps {
  chantier: Chantier
  indicateurs: Indicateur[]
  habilitation: Habilitation
}
