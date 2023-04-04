import { créerRouteurTRPC } from '@/server/infrastructure/api/trpc/trpc';
import { chantierRouter } from './chantier';

export const appRouter = créerRouteurTRPC({
  chantier: chantierRouter,
});
