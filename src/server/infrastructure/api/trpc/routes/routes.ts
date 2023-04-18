import { créerRouteurTRPC } from '@/server/infrastructure/api/trpc/trpc';
import { synthèseDesRésultatsRouter } from './synthèseDesRésultats';
import { publicationRouter } from './publication';

export const appRouter = créerRouteurTRPC({
  synthèseDesRésultats: synthèseDesRésultatsRouter,
  publication: publicationRouter,
});
