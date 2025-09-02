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
        taux_avancement_mandat_proposition_v2: null,
      },
    });

    await this.prisma.getInstance().indicateur_territoire_jalon.updateMany({
      where: {
        id: args.indicId,
        territoire_code: args.territoireCode,
      },
      data: {
        taux_avancement_proposition_v2: null,
      },
    });
  }
}
