import { prisma } from "@/server/db/prisma";
import { ObjectifRepository } from "@/server/gestion-utilisateur/domain/ports/ObjectifRepository";

export class PrismaObjectifRepository implements ObjectifRepository {
  async anonymiserAuteurs(
    auteursAAnonymiserIds: string[],
    emailAuteurRemplacement: string,
  ): Promise<void> {
    const auteurAnonyme = await prisma.utilisateur.findFirst({
      where: {
        email: emailAuteurRemplacement,
      },
    });

    if (auteurAnonyme) {
      await prisma.objectif.updateMany({
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
