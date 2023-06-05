import ProjetStructurant from '@/server/domain/projetStructurant/ProjetStructurant.interface';
import CommentaireProjetStructurant, { TypeCommentaireProjetStructurant } from './Commentaire.interface';

export default interface CommentaireProjetStructurantRepository {
  récupérerLePlusRécent(projetStructurantId: string, type: TypeCommentaireProjetStructurant): Promise<CommentaireProjetStructurant>
  récupérerLesPlusRécentsGroupésParProjetsStructurants(projetStructurantIds: ProjetStructurant['id'][]): Promise<Record<ProjetStructurant['id'], CommentaireProjetStructurant[]>>
}
