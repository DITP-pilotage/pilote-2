import { PrismaPilote } from "@/server/db/PrismaPilote";
import { IndicateurRepository } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/IndicateurRepository";

export class PrismaIndicateurRepository implements IndicateurRepository {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: { prisma: PrismaPilote }) {
    this.prisma = prisma;
  }

  async supprimerTauxAvancementProposition(args: {
    indicId: string;
    territoireCode: string;
  }): Promise<void> {
    await this.prisma.getInstance().indicateur_territoire.update({
      where: {
        id_territoire_code: {
          id: args.indicId,
          territoire_code: args.territoireCode,
        },
      },
      data: {
        taux_avancement_mandat_proposition: null,
      },
    });

    await this.prisma.getInstance().indicateur_territoire_jalon.updateMany({
      where: {
        id: args.indicId,
        territoire_code: args.territoireCode,
      },
      data: {
        taux_avancement_proposition: null,
      },
    });
  }

  async getDateEffectiveValeurAvancement({
    indicId,
    territoireCode,
  }: {
    indicId: string;
    territoireCode: string;
  }): Promise<Date | null> {
    const row = await this.prisma
      .getInstance()
      .indicateur_territoire_jalon.findFirst({
        where: { id: indicId, territoire_code: territoireCode },
        orderBy: { date_valeur_actuelle: "desc" },
      });

    if (!row) return null;
    return row.date_valeur_actuelle;
  }

  async recupererInformationIndicateur(indicId: string): Promise<{
    nom: string;
    chantierId: string;
    chantierNom: string;
  } | null> {
    const indicateur = await this.prisma
      .getInstance()
      .indicateur_identite.findUnique({
        where: { id: indicId },
        include: {
          chantier_identite: {
            select: {
              id: true,
              nom: true,
            },
          },
        },
      });

    if (!indicateur) return null;

    return {
      nom: indicateur.nom,
      chantierId: indicateur.chantier_identite.id,
      chantierNom: indicateur.chantier_identite.nom,
    };
  }
}
