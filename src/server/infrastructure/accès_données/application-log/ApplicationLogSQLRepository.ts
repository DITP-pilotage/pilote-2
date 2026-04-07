import { Prisma } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import {
  type ApplicationLogEntree,
  type ApplicationLogFiltre,
  type ApplicationLogRepository,
  type Granularite,
  type StatistiquesLogs,
} from "@/server/application-log/domain/ApplicationLogRepository.interface";

export class ApplicationLogSQLRepository implements ApplicationLogRepository {
  private readonly prisma;

  constructor({ prisma }: { prisma: PrismaPilote }) {
    this.prisma = prisma.getInstance();
  }

  async lister(
    filtres: ApplicationLogFiltre,
  ): Promise<{ logs: ApplicationLogEntree[]; total: number }> {
    const where: Prisma.application_logWhereInput = {};

    if (filtres.filtreLevel) {
      where.level = filtres.filtreLevel;
    }
    if (filtres.filtreCategorie) {
      where.categorie = filtres.filtreCategorie;
    }
    if (filtres.filtreRecherche) {
      where.message = {
        contains: filtres.filtreRecherche,
        mode: "insensitive",
      };
    }
    if (filtres.dateDebut || filtres.dateFin) {
      where.timestamp = {};
      if (filtres.dateDebut) {
        where.timestamp.gte = filtres.dateDebut;
      }
      if (filtres.dateFin) {
        where.timestamp.lte = filtres.dateFin;
      }
    }

    const [logs, total] = await Promise.all([
      this.prisma.application_log.findMany({
        where,
        orderBy: { timestamp: "desc" },
        skip: (filtres.page - 1) * filtres.taillePage,
        take: filtres.taillePage,
      }),
      this.prisma.application_log.count({ where }),
    ]);

    return {
      logs: logs.map((log) => ({
        id: log.id,
        timestamp: log.timestamp,
        level: log.level,
        categorie: log.categorie,
        message: log.message,
        contexte: log.contexte,
        source: log.source,
        duree_ms: log.duree_ms,
      })),
      total,
    };
  }

  async obtenirStatistiques(
    dateDebut: Date,
    dateFin: Date,
    granularite: Granularite,
  ): Promise<StatistiquesLogs> {
    const where: Prisma.application_logWhereInput = {
      timestamp: { gte: dateDebut, lte: dateFin },
    };

    const [parLevel, parCategorie, timelineRaw] = await Promise.all([
      this.prisma.application_log.groupBy({
        by: ["level"],
        where,
        _count: { _all: true },
      }),
      this.prisma.application_log.groupBy({
        by: ["categorie"],
        where,
        _count: { _all: true },
        orderBy: { _count: { categorie: "desc" } },
      }),
      this.construireTimeline(dateDebut, dateFin, granularite),
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

  async purger(anterieurA: Date): Promise<number> {
    const result = await this.prisma.application_log.deleteMany({
      where: { timestamp: { lt: anterieurA } },
    });
    return result.count;
  }

  private async construireTimeline(
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

    const result = await this.prisma.$queryRaw<
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
