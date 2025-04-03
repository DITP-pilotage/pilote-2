import pino, { Logger } from 'pino';

class AppLogger {
  private readonly _logger: Logger;

  constructor() {
    this._logger = pino({
      level: 'info',
    });
  }

  info(...obj: any): void {
    this._logger.info(obj);
  }

  error(...obj: any): void {
    this._logger.error(obj);
  }

  warn(...obj: any): void {
    this._logger.warn(obj);
  }

  debug(...obj: any): void {
    this._logger.debug(obj);
  }
}

export const logger = new AppLogger();

