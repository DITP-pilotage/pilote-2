import { Commentaire, TypeCommentaire } from '@/server/domain/commentaire/Commentaire.interface';
import Chantier from '@/server/domain/chantier/Chantier.interface';

export default interface CommentaireRepository {
  récupérerHistorique(chantierId: string, territoireCode: string, type: TypeCommentaire): Promise<Commentaire[]>;
  créer(chantierId: string, territoireCode: string, id: string, contenu: string, auteur: string, type: TypeCommentaire, date: Date): Promise<Commentaire>;
  récupérerLePlusRécent(chantierId: string, territoireCode: string, type: TypeCommentaire): Promise<Commentaire>;
  récupérerLesPlusRécentsGroupésParChantier(chantiersIds: Chantier['id'][], territoireCode: string): Promise<Record<Chantier['id'], Commentaire[]>>;
}
