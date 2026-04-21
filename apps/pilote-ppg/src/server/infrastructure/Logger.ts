import pino, { type LogFn } from "pino";
import { type Prisma } from "@prisma/client";
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
): Prisma.InputJsonObject | null {
  const contexte: Record<string, Prisma.InputJsonValue | null> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (!CHAMPS_STANDARD_PINO.has(key)) {
      contexte[key] = value as Prisma.InputJsonValue;
    }
  }
  return Object.keys(contexte).length > 0
    ? (contexte as Prisma.InputJsonObject)
    : null;
}

let prismaPilote: PrismaPilote | null = null;

function getPrismaInstance() {
  if (!process.env.DATABASE_URL) return null;
  if (!prismaPilote) {
    prismaPilote = new PrismaPilote();
  }
  return prismaPilote.getInstance();
}

function captureStackTrace(): string {
  const stack = new Error().stack;
  if (!stack) return "";
  return stack
    .split("\n")
    .slice(4)
    .filter((line) => !line.includes("node_modules"))
    .slice(0, 10)
    .join("\n");
}

function persisterEnBase(
  levelNumber: number,
  obj: Record<string, unknown>,
  msg: string,
): void {
  try {
    const db = getPrismaInstance();
    if (!db?.application_log) return;

    const level = mapPinoLevelToEnum(levelNumber);
    if (!level) return;

    const contexte = extraireContexte(obj);
    const stackTrace =
      level === "ERROR" || level === "WARN"
        ? ((obj.errorStack as string) ??
          (obj.stack as string) ??
          captureStackTrace())
        : null;

    const contexteAvecStack: Prisma.InputJsonObject | undefined =
      contexte || stackTrace
        ? ({
            ...(contexte ?? {}),
            ...(stackTrace ? { stack_trace: stackTrace } : {}),
          } as Prisma.InputJsonObject)
        : undefined;

    db.application_log
      .create({
        data: {
          level: level as "ERROR" | "WARN" | "INFO" | "DEBUG",
          categorie: (obj.categorie as string) ?? "systeme",
          message: msg,
          contexte: contexteAvecStack,
          source: (obj.source as string) ?? null,
          duree_ms: (obj.duree_ms as number) ?? null,
        },
      })
      .catch(() => {});
  } catch {
    // silencieux — ne jamais crasher à cause du logging
  }
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
        logMethod(inputArgs: Parameters<LogFn>, method: LogFn, level: number) {
          const [first, second] = inputArgs;
          if (
            typeof first === "object" &&
            first !== null &&
            typeof second === "string"
          ) {
            persisterEnBase(level, first as Record<string, unknown>, second);
          }
          return method.apply(this, inputArgs);
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
