import { Commentaire, TypeCommentaireChantier } from '@/server/domain/chantier/commentaire/Commentaire.interface';
import Chantier from '@/server/domain/chantier/Chantier.interface';

export default interface CommentaireRepository {
  récupérerHistorique(chantierId: string, territoireCode: string, type: TypeCommentaireChantier): Promise<Commentaire[]>;
  créer(chantierId: string, territoireCode: string, id: string, contenu: string, auteur: string, type: TypeCommentaireChantier, date: Date): Promise<Commentaire>;
  récupérerLePlusRécent(chantierId: string, territoireCode: string, type: TypeCommentaireChantier): Promise<Commentaire>;
  récupérerLesPlusRécentsGroupésParChantier(chantiersIds: Chantier['id'][], territoireCode: string): Promise<Record<Chantier['id'], Commentaire[]>>;
}
