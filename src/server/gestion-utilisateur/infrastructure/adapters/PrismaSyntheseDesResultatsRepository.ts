import { getPrisma } from "@/server/db/PrismaTransaction";
import { SyntheseDesResultatsRepository } from "@/server/gestion-utilisateur/domain/ports/SyntheseDesResultatsRepository";

export class PrismaSyntheseDesResultatsRepository implements SyntheseDesResultatsRepository {
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
        prisma.synthese_des_resultats.updateMany({
          where: {
            auteur_creation_id: {
              in: auteursAAnonymiserIds,
            },
          },
          data: {
            auteur_creation_id: auteurAnonyme.id,
          },
        }),
        prisma.synthese_des_resultats.updateMany({
          where: {
            auteur_modification_id: {
              in: auteursAAnonymiserIds,
            },
          },
          data: {
            auteur_modification_id: auteurAnonyme.id,
          },
        }),
      ]);
    }
  }
}
