import { PropositionValeurActuelleRepository } from '@/server/import-indicateur/domain/ports/PropositionValeurActuelleRepository';
import { StatutProposition } from '@/server/chantiers/domain/StatutProposition';
import { prisma } from '@/server/db/prisma';

export class PrismaPropositionValeurActuelleRepository implements PropositionValeurActuelleRepository {

  async supprimerPropositionsValeurActuelleApresImport({
    indicId,
    zoneId,
    dateValeurImportee,
  }: {
    indicId: string,
    zoneId: string,
    dateValeurImportee: Date
  }): Promise<void> {
    const territoire = await prisma.territoire.findFirst({
      where: {
        zone_id: zoneId,
      },
    });

    await prisma.proposition_valeur_actuelle.updateMany({
      where: {
        indic_id: indicId,
        territoire_code: territoire?.code,
        date_valeur_actuelle: {
          lte: dateValeurImportee,
        },
      },
      data: {
        statut: StatutProposition.SUPPRIME,
      },
    });
  }


}
