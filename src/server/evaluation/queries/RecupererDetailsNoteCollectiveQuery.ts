import { PrismaPilote } from "@/server/db/PrismaPilote";

export class RecupererDetailsNoteCollectiveQuery {
  constructor(private readonly dependencies: { prisma: PrismaPilote }) {}

  async run({
    rattachementCode,
    jalon,
  }: {
    rattachementCode: string;
    jalon: number;
  }) {
    const derniereDateCalcul = await this.dependencies.prisma
      .getInstance()
      .chantier_evaluation.findFirst({
        orderBy: {
          date_calcul: "desc",
        },
        select: {
          date_calcul: true,
        },
      });

    if (!derniereDateCalcul) {
      return [];
    }

    const chantiersEvaluation = await this.dependencies.prisma
      .getInstance()
      .chantier_evaluation.findMany({
        where: {
          territoire_code: rattachementCode,
          jalon,
          date_calcul: derniereDateCalcul.date_calcul,
        },
        include: {
          chantier_identite: true,
        },
      });

    const ministeres = await this.dependencies.prisma
      .getInstance()
      .ministere.findMany();

    return chantiersEvaluation.map((chantier) => {
      const ministereId = chantier.chantier_identite.ministeres[0];
      const ministere = ministeres.find((m) => m.id === ministereId);

      return {
        id: chantier.id,
        nom: chantier.chantier_identite.nom,
        icone_ministere: ministere?.icone ?? null,
        taux_avancement: chantier.taux_avancement,
      };
    });
  }
}
