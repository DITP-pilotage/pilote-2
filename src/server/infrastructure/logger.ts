import pino, { Logger } from 'pino';
import { configuration } from '@/config';

class AppLogger {
  private readonly _logger: Logger;

  constructor() {
    this._logger = pino({
      level: configuration.logLevel,
    });
    this._logger.info({
      logLevel: configuration.logLevel,
      env: configuration.env,
      securedEnv: configuration.env === 'production',
      isUsingDevCredentials: !!configuration.devPassword,
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

const logger = new AppLogger();

export default logger;
