import pino from 'pino';
import config from '@/server/infrastructure/Configuration';

const logger = pino({
  level: config.logLevel,
});

export default logger;
