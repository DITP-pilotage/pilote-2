import build from "pino-abstract-transport";
import { PrismaClient } from "@prisma/client";

export default async function (opts: { databaseUrl?: string }) {
  const prisma = new PrismaClient({
    datasourceUrl: opts.databaseUrl,
  });

  return build(
    async function (source) {
      for await (const log of source) {
        const level = mapPinoLevelToEnum(log.level);
        if (!level) continue;

        try {
          await prisma.application_log.create({
            data: {
              level,
              categorie: log.categorie ?? "systeme",
              message: log.msg ?? "",
              contexte: extraireContexte(log),
              source: log.source ?? null,
              duree_ms: log.duree_ms ?? null,
            },
          });
        } catch {
          // silencieux — ne jamais crasher à cause du logging
        }
      }
    },
    {
      async close() {
        await prisma.$disconnect();
      },
    },
  );
}

function mapPinoLevelToEnum(pinoLevel: number): string | null {
  if (pinoLevel >= 50) return "ERROR";
  if (pinoLevel >= 40) return "WARN";
  if (pinoLevel >= 30) return "INFO";
  if (pinoLevel >= 20) return "DEBUG";
  return null;
}

function extraireContexte(
  log: Record<string, unknown>,
): Record<string, unknown> | null {
  const {
    level: _level,
    time: _time,
    pid: _pid,
    hostname: _hostname,
    msg: _msg,
    categorie: _categorie,
    source: _source,
    duree_ms: _dureeMs,
    ...contexte
  } = log;
  return Object.keys(contexte).length > 0 ? contexte : null;
}
