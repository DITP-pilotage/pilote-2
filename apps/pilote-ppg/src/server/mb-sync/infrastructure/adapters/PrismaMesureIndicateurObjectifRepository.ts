import { Prisma } from "@prisma/client";

import { type PrismaPilote } from "@/server/db/PrismaPilote";
import {
  type MesureIndicateurObjectifRepository,
  type ObjectifMesure,
} from "@/server/mb-sync/domain/ports/MesureIndicateurObjectifRepository";

type RawRow = {
  territoire_code: string;
  metric_date: string;
  metric_value: string;
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
        SELECT DISTINCT ON (mi.zone_id, mi.metric_date)
          t.code AS territoire_code,
          mi.metric_date,
          mi.metric_value
        FROM raw_data.mesure_indicateur mi
        JOIN territoire t ON t.code = mi.zone_id
        JOIN indicateur_identite ii ON ii.id = mi.indic_id
        WHERE mi.indic_id = ${args.indicId}
          AND mi.metric_type = 'vc'
          AND t.maille = ANY(ii.mailles_applicables)
        ORDER BY mi.zone_id, mi.metric_date, mi.date_import DESC
      `,
    );

    return rows.map((row) => ({
      territoire_code: row.territoire_code,
      metric_date: row.metric_date,
      metric_value: row.metric_value === 'null' ? null : parseFloat(row.metric_value),
    }));
  }
}
