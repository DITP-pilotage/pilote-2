import { prisma } from "@/server/db/prisma";
import { PropositionValeurAvancementRepository } from "@/server/gestion-utilisateur/domain/ports/PropositionValeurAvancementRepository";

export class PrismaPropositionValeurAvancementRepository
  implements PropositionValeurAvancementRepository
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
      await prisma.proposition_valeur_actuelle.updateMany({
        where: {
          id_auteur_modification: {
            in: auteursAAnonymiserIds,
          },
        },
        data: {
          id_auteur_modification: auteurAnonyme.id,
        },
      });
    }
  }
}
