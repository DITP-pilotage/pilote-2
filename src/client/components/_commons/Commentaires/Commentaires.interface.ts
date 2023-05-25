import Chantier from '@/server/domain/chantier/Chantier.interface';
import { Commentaire, typesCommentaireMailleNationale, typesCommentaireMailleRégionaleOuDépartementale } from '@/server/domain/chantier/commentaire/Commentaire.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import CommentaireProjetStructurant, { typesCommentaireProjetStructurant } from '@/server/domain/projetStructurant/commentaire/Commentaire.interface';
import ProjetStructurant from '@/server/domain/projetStructurant/ProjetStructurant.interface';

export default interface CommentairesProps {
  commentaires: (Commentaire | CommentaireProjetStructurant)[] | null
  réformeId: Chantier['id'] | ProjetStructurant['id']
  maille: Maille
  nomTerritoire: string
  typesCommentaire: typeof typesCommentaireMailleNationale | typeof typesCommentaireMailleRégionaleOuDépartementale | typeof typesCommentaireProjetStructurant
  modeÉcriture?: boolean
  estInteractif?: boolean
}
