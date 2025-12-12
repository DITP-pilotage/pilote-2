import { PrismaPilote } from "@/server/db/PrismaPilote";

type IndicateurDetailsNoteCollective = {
  id: string;
  nom: string;
  tauxAvancement: number | null;
  tauxAvancementPilote: number | null;
  ponderation: number;
};

type DetailsNoteCollectiveResult = {
  id: string;
  nom: string;
  iconeMinistere: string | null;
  tauxAvancement: number | null;
  tauxAvancementPilote: number | null;
  indicateurs: IndicateurDetailsNoteCollective[];
};

export class RecupererDetailsNoteCollectiveQuery {
  constructor(private readonly dependencies: { prisma: PrismaPilote }) {}

  async run({
    rattachementCode,
    jalon,
  }: {
    rattachementCode: string;
    jalon: number;
  }): Promise<DetailsNoteCollectiveResult[]> {
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
        select: {
          id: true,
          taux_avancement: true,
          chantier_territoire_jalon: {
            select: {
              taux_avancement: true,
              chantier_territoire: {
                select: {
                  chantier_identite: {
                    select: {
                      nom: true,
                      ministeres: true,
                    },
                  },
                },
              },
            },
          },
          indicateur_evaluation: {
            select: {
              id: true,
              taux_avancement: true,
              ponderation_reelle: true,
              indicateur_territoire_jalon: {
                select: {
                  taux_avancement: true,
                  indicateur_territoire: {
                    select: {
                      indicateur_identite: {
                        select: {
                          nom: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

    const ministeres = await this.dependencies.prisma
      .getInstance()
      .ministere.findMany();

    return chantiersEvaluation.map((chantier) => {
      const ministereId =
        chantier.chantier_territoire_jalon.chantier_territoire.chantier_identite
          .ministeres[0];
      const ministereChantier = ministeres.find(
        (ministere) => ministere.id === ministereId,
      );

      const indicateurs = chantier.indicateur_evaluation.map((indicateur) => ({
        id: indicateur.id,
        nom: indicateur.indicateur_territoire_jalon.indicateur_territoire
          .indicateur_identite.nom,
        tauxAvancement: indicateur.taux_avancement,
        tauxAvancementPilote:
          indicateur.indicateur_territoire_jalon.taux_avancement,
        ponderation: indicateur.ponderation_reelle,
      }));

      return {
        id: chantier.id,
        nom: chantier.chantier_territoire_jalon.chantier_territoire
          .chantier_identite.nom,
        iconeMinistere: ministereChantier?.icone ?? null,
        tauxAvancement: chantier.taux_avancement,
        tauxAvancementPilote:
          chantier.chantier_territoire_jalon.taux_avancement,
        indicateurs,
      };
    });
  }
}
