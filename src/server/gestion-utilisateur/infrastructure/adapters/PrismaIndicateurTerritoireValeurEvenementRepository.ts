import { getPrisma } from "@/server/db/PrismaTransaction";
import { IndicateurTerritoireValeurEvenementRepository } from "@/server/gestion-utilisateur/domain/ports/IndicateurTerritoireValeurEvenementRepository";

export class PrismaIndicateurTerritoireValeurEvenementRepository implements IndicateurTerritoireValeurEvenementRepository {
  async anonymiserAuteurs(
    listeIds: string[],
    emailAuteurRemplacement: string,
  ): Promise<void> {
    const prisma = getPrisma();

    const auteurAnonyme = await prisma.utilisateur.findFirst({
      where: {
        email: emailAuteurRemplacement,
      },
    });

    if (auteurAnonyme) {
      await prisma.indicateur_territoire_valeur_evenement.updateMany({
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
