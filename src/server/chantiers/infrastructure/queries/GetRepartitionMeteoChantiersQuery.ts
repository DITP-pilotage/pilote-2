import { Inject } from "@/server/chantiers/module";
import { RepartitionMeteoChantiersContrat } from "@/server/chantiers/app/contrats/RepartitionMeteoChantiersContrat";

export class GetRepartitionMeteoChantiersQuery {
  constructor(private readonly deps: Inject<"prisma">) {}

  async execute(params: {
    chantierIds: string[];
    territoireCode: string;
  }): Promise<RepartitionMeteoChantiersContrat> {
    const prisma = this.deps.prisma.getInstance();

    const meteosGroupee = await prisma.chantier_territoire.groupBy({
      by: ["meteo"],
      _count: true,
      where: {
        territoire_code: params.territoireCode,
        est_applicable: true,
        chantier_identite: {
          NOT: { ministeres: { isEmpty: true } },
        },
        id: { in: params.chantierIds },
      },
    });

    return {
      COUVERT:
        meteosGroupee.find((meteo) => meteo.meteo === "COUVERT")?._count ?? 0,
      NUAGE:
        meteosGroupee.find((meteo) => meteo.meteo === "NUAGE")?._count ?? 0,
      ORAGE:
        meteosGroupee.find((meteo) => meteo.meteo === "ORAGE")?._count ?? 0,
      SOLEIL:
        meteosGroupee.find((meteo) => meteo.meteo === "SOLEIL")?._count ?? 0,
    };
  }
}
