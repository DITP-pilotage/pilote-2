import Chantier from '@/server/domain/chantier/Chantier.interface';
import { Commentaire } from '@/server/domain/commentaire/Commentaire.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import ProjetStructurant from '@/server/domain/projetStructurant/ProjetStructurant.interface';

export default interface CommentairesProps {
  commentaires: Commentaire[] | null
  réformeId: Chantier['id'] | ProjetStructurant['id']
  maille: Maille
  nomTerritoire: string
  modeÉcriture?: boolean
  estInteractif?: boolean
}
