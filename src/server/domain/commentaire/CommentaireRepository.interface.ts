import { Commentaires, Commentaire, TypeCommentaire } from '@/server/domain/commentaire/Commentaire.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';

export default interface CommentaireRepository {
  récupérerHistoriqueDUnCommentaire(chantierId: string, maille: Maille, codeInsee: CodeInsee, type: TypeCommentaire): Promise<Commentaire[]>;
  récupérerLesPlusRécentsParType: (chantierId: string, maille: Maille, codeInsee: CodeInsee) => Promise<Commentaires>;
  créer(chantierId: string, maille: Maille, codeInsee: CodeInsee, id: string, contenu: string, auteur: string, type: TypeCommentaire, date: Date): Promise<Commentaire>;
  récupérerLePlusRécent(chantierId: string, maille: Maille, codeInsee: CodeInsee, type: TypeCommentaire): Promise<Commentaire>;
}
