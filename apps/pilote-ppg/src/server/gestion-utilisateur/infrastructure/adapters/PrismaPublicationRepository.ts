import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { PublicationRepository } from "@/server/gestion-utilisateur/domain/ports/PublicationRepository";

// Commentaires, objectifs, décisions stratégiques et synthèses des résultats.
export class PrismaPublicationRepository implements PublicationRepository {
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
      where: { email: emailAuteurRemplacement },
    });

    if (!auteurAnonyme) {
      return;
    }

    const parCreation = {
      where: { auteur_creation_id: { in: auteursAAnonymiserIds } },
      data: { auteur_creation_id: auteurAnonyme.id },
    };
    const parModification = {
      where: { auteur_modification_id: { in: auteursAAnonymiserIds } },
      data: { auteur_modification_id: auteurAnonyme.id },
    };

    await this.prisma.commentaire.updateMany(parModification);
    await this.prisma.commentaire.updateMany(parCreation);
    await this.prisma.objectif.updateMany(parModification);
    await this.prisma.objectif.updateMany(parCreation);
    await this.prisma.decision_strategique.updateMany(parModification);
    await this.prisma.decision_strategique.updateMany(parCreation);
    await this.prisma.synthese_des_resultats.updateMany(parCreation);
    await this.prisma.synthese_des_resultats.updateMany(parModification);
  }
}
