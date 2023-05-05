import { Commentaire, TypeCommentaire } from '@/server/domain/commentaire/Commentaire.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import Chantier from '@/server/domain/chantier/Chantier.interface';

export default interface CommentaireRepository {
  récupérerHistorique(chantierId: string, maille: Maille, codeInsee: CodeInsee, type: TypeCommentaire): Promise<Commentaire[]>;
  créer(chantierId: string, maille: Maille, codeInsee: CodeInsee, id: string, contenu: string, auteur: string, type: TypeCommentaire, date: Date): Promise<Commentaire>;
  récupérerLePlusRécent(chantierId: string, maille: Maille, codeInsee: CodeInsee, type: TypeCommentaire): Promise<Commentaire>;
  récupérerLesPlusRécentsGroupésParChantier(chantiersIds: Chantier['id'][], maille: string, codeInsee: string): Promise<Record<Chantier['id'], Commentaire[]>>;
}
