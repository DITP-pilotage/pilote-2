import { $Enums, Prisma } from "@prisma/client";
import type { Inject } from "@/server/application-log/module";

export type ApplicationLogFiltre = {
  page: number;
  taillePage: number;
  filtreLevel?: $Enums.log_level;
  filtreCategorie?: string;
  filtreRecherche?: string;
  dateDebut?: Date;
  dateFin?: Date;
};

export type ApplicationLogEntree = {
  id: string;
  timestamp: Date;
  level: $Enums.log_level;
  categorie: string;
  message: string;
  contexte: unknown;
  source: string | null;
  duree_ms: number | null;
};

export class ListerLogsQuery {
  constructor(private readonly deps: Inject<"prisma">) {}

  async run(
    filtres: ApplicationLogFiltre,
  ): Promise<{ logs: ApplicationLogEntree[]; total: number }> {
    const prisma = this.deps.prisma.getInstance();
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
      prisma.application_log.findMany({
        where,
        orderBy: { timestamp: "desc" },
        skip: (filtres.page - 1) * filtres.taillePage,
        take: filtres.taillePage,
      }),
      prisma.application_log.count({ where }),
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
}
