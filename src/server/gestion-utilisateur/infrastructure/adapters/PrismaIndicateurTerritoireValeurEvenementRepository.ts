import { PrismaPilote } from "@/server/db/PrismaPilote";
import { IndicateurTerritoireValeurEvenementRepository } from "@/server/gestion-utilisateur/domain/ports/IndicateurTerritoireValeurEvenementRepository";

export class PrismaIndicateurTerritoireValeurEvenementRepository implements IndicateurTerritoireValeurEvenementRepository {
  private prismaClient: PrismaPilote;

  constructor({ prisma }: { prisma: PrismaPilote }) {
    this.prismaClient = prisma;
  }

  get prisma() {
    return this.prismaClient.getInstance();
  }

  async anonymiserAuteurs(
    listeIds: string[],
    emailAuteurRemplacement: string,
  ): Promise<void> {
    const auteurAnonyme = await this.prisma.utilisateur.findFirst({
      where: {
        email: emailAuteurRemplacement,
      },
    });

    if (auteurAnonyme) {
      await this.prisma.indicateur_territoire_valeur_evenement.updateMany({
        where: {
          id_auteur_modification: {
            in: listeIds,
          },
        },
        data: {
          id_auteur_modification: auteurAnonyme.id,
        },
      });
    }
  }
}
