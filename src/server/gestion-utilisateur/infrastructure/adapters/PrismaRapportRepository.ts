import { prisma } from '@/server/db/prisma';
import { RapportRepository } from '@/server/gestion-utilisateur/domain/ports/RapportRepository';

export class PrismaRapportRepository implements RapportRepository {
  async anonymiserAuteurs(auteursAAnonymiserEmails: string[], emailAuteurRemplacement: string): Promise<void> {
    await prisma.rapport_import_mesure_indicateur.updateMany({
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
