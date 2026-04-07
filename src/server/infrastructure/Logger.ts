import pino, { type Logger } from "pino";
import path from "node:path";

const pinoPrismaTransportPath = path.resolve(
  process.cwd(),
  "src/server/infrastructure/pino-prisma-transport.js",
);

class AppLogger implements Pick<Logger, "info" | "error" | "warn"> {
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
          {
            target: pinoPrismaTransportPath,
            options: { databaseUrl: process.env.DATABASE_URL },
            level: "info",
          },
        ],
      },
    });
  }

  info(...obj: unknown[]) {
    this._logger.info(obj);
  }

  error(...obj: unknown[]) {
    this._logger.error(obj);
  }

  warn(...obj: unknown[]) {
    this._logger.warn(obj);
  }

  debug(...obj: unknown[]) {
    this._logger.debug(obj);
  }
}

const logger = new AppLogger();

export default logger;
