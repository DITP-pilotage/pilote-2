import { PrismaPilote } from "@/server/db/PrismaPilote";
import { ObjectifRepository } from "@/server/gestion-utilisateur/domain/ports/ObjectifRepository";

export class PrismaObjectifRepository implements ObjectifRepository {
  private prismaClient: PrismaPilote;

  constructor({ prisma }: { prisma: PrismaPilote }) {
    this.prismaClient = prisma;
  }

  get prisma() {
    return this.prismaClient.getInstance();
  }

  async anonymiserAuteurs(
    auteursAAnonymiserIds: string[],
    emailAuteurRemplacement: string,
  ): Promise<void> {
    const auteurAnonyme = await this.prisma.utilisateur.findFirst({
      where: {
        email: emailAuteurRemplacement,
      },
    });

    if (auteurAnonyme) {
      await this.prisma.objectif.updateMany({
        where: {
          auteur_modification_id: {
            in: auteursAAnonymiserIds,
          },
        },
        data: {
          auteur_modification_id: auteurAnonyme.id,
        },
      });
      await this.prisma.objectif.updateMany({
        where: {
          auteur_creation_id: {
            in: auteursAAnonymiserIds,
          },
        },
        data: {
          auteur_creation_id: auteurAnonyme.id,
        },
      });
    }
  }
}
