import Chantier from '@/server/domain/chantier/Chantier.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import { RouterOutputs } from '@/server/infrastructure/api/trpc/trpc.interface';

export default interface CommentairesProps {
  commentaires: RouterOutputs['publication']['récupérerLaPlusRécenteParType']
  chantierId: Chantier['id']
  maille: Maille
  codeInsee: CodeInsee
  modeÉcriture?: boolean
  estInteractif?: boolean
}
