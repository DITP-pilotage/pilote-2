import { prisma } from '@/server/db/prisma';
import SyntheseDesResultatsRepository from '@/server/gestion-utilisateur/domain/ports/SyntheseDesResultatsRepository';

export class PrismaSyntheseDesResultatsRepository implements SyntheseDesResultatsRepository {
  async anonymiserAuteurs(auteursAAnonymiserIds: string[], emailAuteurRemplacement: string): Promise<void> {
    const auteurAnonyme = await prisma.utilisateur.findFirst({
      where: {
        email: emailAuteurRemplacement,
      },
    });

    if (auteurAnonyme) {
      await prisma.synthese_des_resultats.updateMany({
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
