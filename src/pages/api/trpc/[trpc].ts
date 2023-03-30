import { createNextApiHandler } from '@trpc/server/adapters/next';

import { appRouter } from '@/server/infrastructure/api/trpc/routes/routes';
import logger from '@/server/infrastructure/logger';
import { créerContextTRPC } from '@/server/infrastructure/api/trpc/trpc';

export default createNextApiHandler({
  router: appRouter,
  createContext: créerContextTRPC,
  onError:
    process.env.NODE_ENV === 'development'
      ? ({ path, error }) => logger.error(`Erreur TRPC pour ${path ?? '<no-path>'}: ${error.message}`)
      : undefined,
});
