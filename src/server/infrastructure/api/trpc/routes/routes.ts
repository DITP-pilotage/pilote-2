import { créerRouteurTRPC } from '@/server/infrastructure/api/trpc/trpc';
import { synthèseDesRésultatsRouter } from './synthèseDesRésultats';
import { commentaireRouter } from './commentaire';
import { publicationRouter } from './publication';

export const appRouter = créerRouteurTRPC({
  synthèseDesRésultats: synthèseDesRésultatsRouter,
  commentaire: commentaireRouter,
  publication: publicationRouter,
});
