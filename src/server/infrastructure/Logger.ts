import pino, { type Logger } from "pino";
import path from "node:path";

// process.cwd() nécessaire car __dirname est virtualisé par Turbopack en dev.
// Pour le mode standalone, le fichier doit être copié dans le bundle (cf. next.config).
const pinoPrismaTransportPath = path.resolve(
  process.cwd(),
  "src/server/infrastructure/pino-prisma-transport.js",
);

interface StructuredLogger {
  info(obj: Record<string, unknown>, msg: string): void;
  error(obj: Record<string, unknown>, msg: string): void;
  warn(obj: Record<string, unknown>, msg: string): void;
  debug(obj: Record<string, unknown>, msg: string): void;
}

class AppLogger implements StructuredLogger {
  private readonly _logger: Logger;

  constructor() {
    this._logger = pino({
      level: "info",
      transport: {
        targets: [
          {
            target: "pino/file",
            options: { destination: 1 },
            level: "info",
          },
          ...(process.env.DATABASE_URL
            ? [
                {
                  target: pinoPrismaTransportPath,
                  options: { databaseUrl: process.env.DATABASE_URL },
                  level: "info",
                },
              ]
            : []),
        ],
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
