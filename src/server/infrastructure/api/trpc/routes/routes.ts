import { créerRouteurTRPC } from '@/server/infrastructure/api/trpc/trpc';
import { indicateurRouter } from './indicateur';

export const appRouter = créerRouteurTRPC({
  indicateur: indicateurRouter,
});
