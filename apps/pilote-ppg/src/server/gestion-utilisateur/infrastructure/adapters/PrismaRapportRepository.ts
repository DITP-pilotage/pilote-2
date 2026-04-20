import { PrismaPilote } from "@/server/db/PrismaPilote";
import { RapportRepository } from "@/server/gestion-utilisateur/domain/ports/RapportRepository";

export class PrismaRapportRepository implements RapportRepository {
  private prismaClient: PrismaPilote;

  constructor({ prisma }: { prisma: PrismaPilote }) {
    this.prismaClient = prisma;
  }

  get prisma() {
    return this.prismaClient.getInstance();
  }

  async anonymiserAuteurs(
    auteursAAnonymiserEmails: string[],
    emailAuteurRemplacement: string,
  ): Promise<void> {
    await this.prisma.rapport_import_mesure_indicateur.updateMany({
      where: {
        utilisateurEmail: {
          in: auteursAAnonymiserEmails,
        },
      },
      data: {
        utilisateurEmail: emailAuteurRemplacement,
      },
    });
  }
}
