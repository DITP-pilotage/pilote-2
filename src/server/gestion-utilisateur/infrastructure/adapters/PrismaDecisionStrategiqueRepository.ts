import { prisma } from "@/server/db/prisma";
import { DecisionStrategiqueRepository } from "@/server/gestion-utilisateur/domain/ports/DecisionStrategiqueRepository";

export class PrismaDecisionStrategiqueRepository
  implements DecisionStrategiqueRepository
{
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
      await prisma.decision_strategique.updateMany({
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
