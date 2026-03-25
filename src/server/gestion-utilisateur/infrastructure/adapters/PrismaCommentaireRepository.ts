import { getPrisma } from "@/server/db/PrismaTransaction";
import { CommentaireRepository } from "@/server/gestion-utilisateur/domain/ports/CommentaireRepository";

export class PrismaCommentaireRepository implements CommentaireRepository {
  async anonymiserAuteurs(
    auteursAAnonymiserIds: string[],
    emailAuteurRemplacement: string,
  ): Promise<void> {
    const prisma = getPrisma();

    const auteurAnonyme = await prisma.utilisateur.findFirst({
      where: {
        email: emailAuteurRemplacement,
      },
    });

    if (auteurAnonyme) {
      await Promise.all([
        prisma.commentaire.updateMany({
          where: {
            auteur_modification_id: {
              in: auteursAAnonymiserIds,
            },
          },
          data: {
            auteur_modification_id: auteurAnonyme.id,
          },
        }),
        prisma.commentaire.updateMany({
          where: {
            auteur_creation_id: {
              in: auteursAAnonymiserIds,
            },
          },
          data: {
            auteur_creation_id: auteurAnonyme.id,
          },
        }),
      ]);
    }
  }
}
