import pino from "pino";
import { PrismaPilote } from "@/server/db/PrismaPilote";

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

function mapPinoLevelToEnum(pinoLevel: number): string | null {
  if (pinoLevel >= 50) return "ERROR";
  if (pinoLevel >= 40) return "WARN";
  if (pinoLevel >= 30) return "INFO";
  if (pinoLevel >= 20) return "DEBUG";
  return null;
}

function extraireContexte(
  obj: Record<string, unknown>,
): Record<string, unknown> | null {
  const contexte: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (!CHAMPS_STANDARD_PINO.has(key)) {
      contexte[key] = value;
    }
  }
  return Object.keys(contexte).length > 0 ? contexte : null;
}

let prismaPilote: PrismaPilote | null = null;

function getPrismaInstance() {
  if (!process.env.DATABASE_URL) return null;
  if (!prismaPilote) {
    prismaPilote = new PrismaPilote();
  }
  return prismaPilote.getInstance();
}

function persisterEnBase(
  levelNumber: number,
  obj: Record<string, unknown>,
  msg: string,
): void {
  const db = getPrismaInstance();
  if (!db) return;

  const level = mapPinoLevelToEnum(levelNumber);
  if (!level) return;

  db.application_log
    .create({
      data: {
        level: level as "ERROR" | "WARN" | "INFO" | "DEBUG",
        categorie: (obj.categorie as string) ?? "systeme",
        message: msg,
        contexte: extraireContexte(obj) ?? undefined,
        source: (obj.source as string) ?? null,
        duree_ms: (obj.duree_ms as number) ?? null,
      },
    })
    .catch(() => {
      // silencieux — ne jamais crasher à cause du logging
    });
}

interface StructuredLogger {
  info(obj: Record<string, unknown>, msg: string): void;
  error(obj: Record<string, unknown>, msg: string): void;
  warn(obj: Record<string, unknown>, msg: string): void;
  debug(obj: Record<string, unknown>, msg: string): void;
}

class AppLogger implements StructuredLogger {
  private readonly _logger: pino.Logger;

  constructor() {
    this._logger = pino({
      level: "info",
      hooks: {
        logMethod(inputArgs, method, level) {
          const [obj, msg] = inputArgs as [Record<string, unknown>, string];
          if (
            typeof obj === "object" &&
            obj !== null &&
            typeof msg === "string"
          ) {
            persisterEnBase(level, obj, msg);
          }
          return method.apply(this, inputArgs as Parameters<typeof method>);
        },
      },
    });
  }

  info(obj: Record<string, unknown>, msg: string): void {
    this._logger.info(obj, msg);
  }

  error(obj: Record<string, unknown>, msg: string): void {
    this._logger.error(obj, msg);
  }

  warn(obj: Record<string, unknown>, msg: string): void {
    this._logger.warn(obj, msg);
  }

  debug(obj: Record<string, unknown>, msg: string): void {
    this._logger.debug(obj, msg);
  }
}

const logger = new AppLogger();

export default logger;
