import { Prisma } from "@prisma/client";

import { type PrismaPilote } from "@/server/db/PrismaPilote";
import {
  type MesureIndicateurObjectifRepository,
  type ObjectifMesure,
} from "@/server/mb-sync/domain/ports/MesureIndicateurObjectifRepository";

type RawRow = {
  zone_id: string;
  metric_date: string;
  metric_value: string | null;
};

export class PrismaMesureIndicateurObjectifRepository
  implements MesureIndicateurObjectifRepository
{
  constructor(private readonly dependencies: { prisma: PrismaPilote }) {}

  private get prisma() {
    return this.dependencies.prisma.getInstance();
  }

  async recupererDernieresValeursCibles(args: {
    indicId: string;
  }): Promise<ObjectifMesure[]> {
    const rows = await this.prisma.$queryRaw<RawRow[]>(
      Prisma.sql`
        SELECT DISTINCT ON (zone_id, metric_date)
          zone_id,
          metric_date,
          metric_value
        FROM raw_data.mesure_indicateur
        WHERE indic_id = ${args.indicId}
          AND metric_type = 'vc'
        ORDER BY zone_id, metric_date, date_import DESC
      `,
    );

    return rows.map((row) => ({
      zone_id: row.zone_id,
      metric_date: row.metric_date,
      metric_value: row.metric_value !== null ? parseFloat(row.metric_value) : null,
    }));
  }
}
