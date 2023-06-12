import pino from 'pino';
import config from '@/server/infrastructure/Configuration';

const logger = pino({
  level: config.logLevel,
});

logger.info({
  logLevel: config.logLevel,
  env: config.env,
  securedEnv: config.securedEnv,
  isUsingDevCredentials: config.isUsingDevCredentials,
});

export default logger;
