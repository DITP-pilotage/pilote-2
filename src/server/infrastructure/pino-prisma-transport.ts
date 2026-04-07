import build from "pino-abstract-transport";
import { type $Enums, Prisma, PrismaClient } from "@prisma/client";

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
              contexte:
                (extraireContexte(log) as Prisma.InputJsonValue) ??
                Prisma.JsonNull,
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

function mapPinoLevelToEnum(pinoLevel: number): $Enums.log_level | null {
  if (pinoLevel >= 50) return "ERROR";
  if (pinoLevel >= 40) return "WARN";
  if (pinoLevel >= 30) return "INFO";
  if (pinoLevel >= 20) return "DEBUG";
  return null;
}

const CHAMPS_STANDARD_PINO = new Set([
  "level",
  "time",
  "pid",
  "hostname",
  "msg",
  "categorie",
  "source",
  "duree_ms",
]);

function extraireContexte(
  log: Record<string, unknown>,
): Record<string, unknown> | null {
  const contexte: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(log)) {
    if (!CHAMPS_STANDARD_PINO.has(key)) {
      contexte[key] = value;
    }
  }
  return Object.keys(contexte).length > 0 ? contexte : null;
}
