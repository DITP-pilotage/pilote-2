import { getPrisma } from "@/server/db/PrismaTransaction";
import { DecisionStrategiqueRepository } from "@/server/gestion-utilisateur/domain/ports/DecisionStrategiqueRepository";

export class PrismaDecisionStrategiqueRepository implements DecisionStrategiqueRepository {
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
        prisma.decision_strategique.updateMany({
          where: {
            auteur_modification_id: {
              in: auteursAAnonymiserIds,
            },
          },
          data: {
            auteur_modification_id: auteurAnonyme.id,
          },
        }),
        prisma.decision_strategique.updateMany({
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
