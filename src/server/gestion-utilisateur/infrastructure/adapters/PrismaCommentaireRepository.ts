import { prisma } from '@/server/db/prisma';
import { CommentaireRepository } from '@/server/gestion-utilisateur/domain/ports/CommentaireRepository';

export class PrismaCommentaireRepository implements CommentaireRepository {
    
  async anonymiserAuteurs(auteursAAnonymiserIds: string[], emailAuteurRemplacement: string): Promise<void> {
    const auteurAnonyme = await prisma.utilisateur.findFirst({
      where: {
        email: emailAuteurRemplacement,
      },
    });

    if (auteurAnonyme) {
      await prisma.commentaire.updateMany({
        where: {
          auteur_id: {
            in: auteursAAnonymiserIds,
          },
        },
        data: {
          auteur_id: auteurAnonyme.id,
        },
      });       
    }
  }
}
