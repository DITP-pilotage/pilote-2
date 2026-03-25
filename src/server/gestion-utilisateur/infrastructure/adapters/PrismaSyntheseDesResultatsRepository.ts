import { PrismaPilote } from "@/server/db/PrismaPilote";
import { SyntheseDesResultatsRepository } from "@/server/gestion-utilisateur/domain/ports/SyntheseDesResultatsRepository";

export class PrismaSyntheseDesResultatsRepository implements SyntheseDesResultatsRepository {
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
      await Promise.all([
        this.prisma.synthese_des_resultats.updateMany({
          where: {
            auteur_creation_id: {
              in: auteursAAnonymiserIds,
            },
          },
          data: {
            auteur_creation_id: auteurAnonyme.id,
          },
        }),
        this.prisma.synthese_des_resultats.updateMany({
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
