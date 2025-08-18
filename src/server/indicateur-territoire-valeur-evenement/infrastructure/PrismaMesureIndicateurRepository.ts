import { randomUUID } from "node:crypto";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import {
  MesureIndicateur,
  MesureIndicateurRepository,
} from "@/server/indicateur-territoire-valeur-evenement/domain/ports/MesureIndicateurRepository";
import { convertirTerritoireCodeEnZoneId } from "@/server/app/domain/Territoire";
import { toISODate } from "@/server/app/domain/Dates";

export class PrismaMesureIndicateurRepository
  implements MesureIndicateurRepository
{
  private readonly prismaClient: PrismaPilote;

  constructor({ prisma }: { prisma: PrismaPilote }) {
    this.prismaClient = prisma;
  }

  async enregistrer(mesureIndicateur: MesureIndicateur): Promise<void> {
    await this.prismaClient.getInstance().mesure_indicateur.create({
      data: {
        id: randomUUID(),
        indic_id: mesureIndicateur.indicId,
        zone_id: convertirTerritoireCodeEnZoneId(
          mesureIndicateur.territoireCode,
        ),
        metric_date: toISODate(mesureIndicateur.dateValeur),
        metric_value: mesureIndicateur.valeur.toString(),
        metric_type: "va",
      },
    });
  }
}
