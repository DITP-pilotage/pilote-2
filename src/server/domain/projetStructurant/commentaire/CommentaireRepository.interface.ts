import ProjetStructurant from '@/server/domain/projetStructurant/ProjetStructurant.interface';
import CommentaireProjetStructurant, { TypeCommentaireProjetStructurant } from './Commentaire.interface';

export default interface CommentaireProjetStructurantRepository {
  récupérerLePlusRécent(projetStructurantId: string, type: TypeCommentaireProjetStructurant): Promise<CommentaireProjetStructurant>
  récupérerLesPlusRécentsGroupésParProjetsStructurants(projetStructurantIds: ProjetStructurant['id'][]): Promise<Record<ProjetStructurant['id'], CommentaireProjetStructurant[]>>
  créer(projetStructurantId: string, id: string, contenu: string, auteur: string, type: TypeCommentaireProjetStructurant, date: Date): Promise<CommentaireProjetStructurant> 
  récupérerHistorique(projetStructurantId: string, type: TypeCommentaireProjetStructurant): Promise<CommentaireProjetStructurant[]>
}
