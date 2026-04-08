import { Prisma } from "@prisma/client";
import { $Enums } from "@prisma/client";
import type { Inject } from "@/server/application-log/module";

export type Granularite = "heure" | "jour" | "semaine";

export type StatistiquesLogs = {
  parLevel: { level: $Enums.log_level; count: number }[];
  parCategorie: { categorie: string; count: number }[];
  timeline: { date: string; info: number; warn: number; error: number }[];
};

export class ObtenirStatistiquesLogsQuery {
  constructor(private readonly deps: Inject<"prisma">) {}

  async run(input: {
    dateDebut: Date;
    dateFin: Date;
    granularite: Granularite;
  }): Promise<StatistiquesLogs> {
    const prisma = this.deps.prisma.getInstance();
    const where: Prisma.application_logWhereInput = {
      timestamp: { gte: input.dateDebut, lte: input.dateFin },
    };

    const [parLevel, parCategorie, timelineRaw] = await Promise.all([
      prisma.application_log.groupBy({
        by: ["level"],
        where,
        _count: { _all: true },
      }),
      prisma.application_log.groupBy({
        by: ["categorie"],
        where,
        _count: { _all: true },
        orderBy: { _count: { categorie: "desc" } },
      }),
      this.construireTimeline(
        prisma,
        input.dateDebut,
        input.dateFin,
        input.granularite,
      ),
    ]);

    return {
      parLevel: parLevel.map((entry) => ({
        level: entry.level,
        count: entry._count._all,
      })),
      parCategorie: parCategorie.map((entry) => ({
        categorie: entry.categorie,
        count: entry._count._all,
      })),
      timeline: timelineRaw,
    };
  }

  private async construireTimeline(
    prisma: ReturnType<Inject<"prisma">["prisma"]["getInstance"]>,
    dateDebut: Date,
    dateFin: Date,
    granularite: Granularite,
  ): Promise<{ date: string; info: number; warn: number; error: number }[]> {
    const trunc =
      granularite === "heure"
        ? "hour"
        : granularite === "jour"
          ? "day"
          : "week";

    const result = await prisma.$queryRaw<
      { bucket: Date; level: string; count: bigint }[]
    >(
      Prisma.sql`
        SELECT date_trunc(${trunc}, timestamp) as bucket, level, count(*)::bigint as count
        FROM application_log
        WHERE timestamp >= ${dateDebut} AND timestamp <= ${dateFin}
        GROUP BY bucket, level
        ORDER BY bucket
      `,
    );

    const buckets = new Map<
      string,
      { info: number; warn: number; error: number }
    >();
    for (const row of result) {
      const key = row.bucket.toISOString();
      if (!buckets.has(key)) {
        buckets.set(key, { info: 0, warn: 0, error: 0 });
      }
      const entry = buckets.get(key)!;
      const level = row.level.toLowerCase();
      if (level === "info") entry.info = Number(row.count);
      else if (level === "warn") entry.warn = Number(row.count);
      else if (level === "error") entry.error = Number(row.count);
    }

    return [...buckets.entries()].map(([date, counts]) => ({
      date,
      ...counts,
    }));
  }
}
