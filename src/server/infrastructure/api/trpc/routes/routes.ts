import { créerRouteurTRPC } from '@/server/infrastructure/api/trpc/trpc';
import { chantierRouter } from './chantier';
import { synthèseDesRésultatsRouter } from './synthèseDesRésultats';
import { publicationRouter } from './publication';

export const appRouter = créerRouteurTRPC({
  chantier: chantierRouter,
  synthèseDesRésultats: synthèseDesRésultatsRouter,
  publication: publicationRouter,
});
