import { PropositionValeurAvancementRepository } from '@/server/import-indicateur/domain/ports/PropositionValeurAvancementRepository';
import { StatutProposition } from '@/server/chantiers/domain/StatutProposition';
import { prisma } from '@/server/db/prisma';

export class PrismaPropositionValeurAvancementRepository implements PropositionValeurAvancementRepository {

  async modifierStatutPropositionsValeurAvancementApresImport({
    indicId,
    zoneId,
    dateValeurImportee,
    valeurImportee,
  }: {
    indicId: string,
    zoneId: string,
    dateValeurImportee: Date
    valeurImportee: number
  }): Promise<void> {
    const territoire = await prisma.territoire.findFirst({
      where: {
        zone_id: zoneId,
      },
    });

    const proposition = await prisma.proposition_valeur_actuelle.findFirst({
      where: {
        indic_id: indicId,
        territoire_code: territoire?.code,
        statut: StatutProposition.EN_COURS,
      },
    });

    const dateValeurImporteeString = dateValeurImportee.toISOString();
    if (proposition && proposition.date_valeur_actuelle && dateValeurImporteeString >= proposition.date_valeur_actuelle.toISOString()) {
      const dateValeurProposeeString = proposition.date_valeur_actuelle.toISOString();
      const nouveauStatut = dateValeurImporteeString === dateValeurProposeeString
        ? (valeurImportee === proposition.valeur_actuelle_proposee ? StatutProposition.ACCEPTEE_VIA_IMPORT : StatutProposition.TRAITEE_VIA_IMPORT)
        : StatutProposition.IGNOREE_VIA_IMPORT;

      await prisma.proposition_valeur_actuelle.update({
        where: {
          id: proposition.id,
        },
        data: {
          statut: nouveauStatut,
          date_modification_statut: new Date(),
        },
      });
    }
  }
}
