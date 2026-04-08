import pino, { type Logger } from "pino";
import path from "node:path";

const pinoPrismaTransportPath = path.resolve(
  __dirname,
  "pino-prisma-transport.js",
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
