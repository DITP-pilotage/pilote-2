import { Commentaire } from '@/server/fiche-conducteur/domain/Commentaire';

export interface CommentaireRepository {
  listerCommentaireParChantierId: ({ chantierId }: { chantierId: string }) => Promise<Commentaire[]>
}
