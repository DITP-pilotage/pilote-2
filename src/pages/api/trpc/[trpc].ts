import { createNextApiHandler } from '@trpc/server/adapters/next';

import { appRouter } from '@/server/infrastructure/api/trpc/routes/routes';
import logger from '@/server/infrastructure/logger';
import { créerContextTRPC } from '@/server/infrastructure/api/trpc/trpc';

export default createNextApiHandler({
  router: appRouter,
  createContext: créerContextTRPC,
  onError:({ error, ctx, path, input }) => 
    logger.error({ 
      'type': error.name,
      'message': error.message,
      'path': path,
      'input': input,
      'utilisateur': ctx?.session?.user.email,
      'habilitations': ctx?.session?.habilitations,
    }),
});
