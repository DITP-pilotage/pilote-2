import { créerRouteurTRPC } from '@/server/infrastructure/api/trpc/trpc';
import { synthèseDesRésultatsRouter } from './synthèseDesRésultats';

export const appRouter = créerRouteurTRPC({
  synthèseDesRésultats: synthèseDesRésultatsRouter,
});
