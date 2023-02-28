import { Commentaires } from '@/server/domain/chantier/Commentaire.interface';

export default interface CommentaireRepository {
  getByChantierIdAndTerritoire(chantierId: string, maille: string, codeInsee: string): Promise<Commentaires>;
}
