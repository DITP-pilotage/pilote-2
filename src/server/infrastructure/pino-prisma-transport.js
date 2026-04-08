"use strict";

const build = require("pino-abstract-transport");
const { PrismaClient } = require("@prisma/client");

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

function mapPinoLevelToEnum(pinoLevel) {
  if (pinoLevel >= 50) return "ERROR";
  if (pinoLevel >= 40) return "WARN";
  if (pinoLevel >= 30) return "INFO";
  if (pinoLevel >= 20) return "DEBUG";
  return null;
}

function extraireContexte(log) {
  const contexte = {};
  for (const [key, value] of Object.entries(log)) {
    if (!CHAMPS_STANDARD_PINO.has(key)) {
      contexte[key] = value;
    }
  }
  return Object.keys(contexte).length > 0 ? contexte : null;
}

module.exports = async function (opts) {
  const prismaOptions = opts.databaseUrl
    ? { datasourceUrl: opts.databaseUrl }
    : {};
  const prisma = new PrismaClient(prismaOptions);

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
              contexte: extraireContexte(log) ?? undefined,
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
};
