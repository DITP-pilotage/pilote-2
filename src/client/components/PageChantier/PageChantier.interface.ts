import Chantier from '@/server/domain/chantier/Chantier.interface';
import { DétailsCommentaire } from '@/server/domain/commentaire/Commentaire.interface';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';

export default interface PageChantierProps {
  chantier: Chantier
  indicateurs: Indicateur[]
  objectif: DétailsCommentaire | null
}
