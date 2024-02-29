import pino from 'pino';
import configuration from '@/server/infrastructure/Configuration';
import config from '@/config';

const logger = pino({
  level: configuration.logLevel,
});

logger.info({
  logLevel: configuration.logLevel,
  env: config.env,
  securedEnv: config.env === 'production',
  isUsingDevCredentials: configuration.isUsingDevCredentials,
});

export default logger;
