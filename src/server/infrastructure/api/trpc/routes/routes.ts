import { créerRouteurTRPC } from '@/server/infrastructure/api/trpc/trpc';
import { objectifRouter } from '@/server/infrastructure/api/trpc/routes/objectif';
import { synthèseDesRésultatsRouter } from './synthèseDesRésultats';
import { commentaireRouter } from './commentaire';

export const appRouter = créerRouteurTRPC({
  objectif: objectifRouter,
  synthèseDesRésultats: synthèseDesRésultatsRouter,
  commentaire: commentaireRouter,
});
