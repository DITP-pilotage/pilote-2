import { PrismaPilote } from "@/server/db/PrismaPilote";
import { comparerDates, formaterDate } from "@/client/utils/date/date";

export type PointEvolutionAvancement = {
  date: string;
  valeur: number;
  taux_avancement_jalon: number | null;
};

export class GetEvolutionIndicateurTerritoireQuery {
  constructor(private readonly deps: { prisma: PrismaPilote }) {}

  async execute(params: {
    indicateurId: string;
    territoireCode: string;
  }): Promise<PointEvolutionAvancement[]> {
    const prisma = this.deps.prisma.getInstance();

    const ligne = await prisma.indicateur_territoire.findFirst({
      where: {
        id: params.indicateurId,
        territoire_code: params.territoireCode,
      },
      select: { evolution_avancement: true },
    });

    const points =
      (ligne?.evolution_avancement as
        | {
            date: string;
            valeur: number;
            taux_avancement_jalon?: number | null;
          }[]
        | null) ?? [];

    return [...points]
      .sort((a, b) => comparerDates(a.date, b.date))
      .map(({ date, valeur, taux_avancement_jalon }) => ({
        date: formaterDate(date, "MM/YYYY")!,
        valeur,
        taux_avancement_jalon: taux_avancement_jalon ?? null,
      }));
  }
}
