import pino, { Logger } from "pino";

class AppLogger implements Pick<Logger, "info" | "error" | "warn"> {
  private readonly _logger: Logger;

  constructor() {
    this._logger = pino({
      level: "info",
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
