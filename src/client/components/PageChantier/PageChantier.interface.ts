import Chantier from '@/server/domain/chantier/Chantier.interface';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';

export default interface PageChantierProps {
  indicateurs: Indicateur[]
  chantierId: Chantier['id']
}
