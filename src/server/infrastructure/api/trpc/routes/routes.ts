import { créerRouteurTRPC } from '@/server/infrastructure/api/trpc/trpc';
import { chantierRouter } from './chantier';
import { synthèseDesRésultatsRouter } from './synthèseDesRésultats';
import { publicationRouter } from './publication';
import { indicateurRouter } from './indicateur';
import { territoireRouter } from './territoire';

export const appRouter = créerRouteurTRPC({
  chantier: chantierRouter,
  synthèseDesRésultats: synthèseDesRésultatsRouter,
  publication: publicationRouter,
  indicateur: indicateurRouter,
  territoire: territoireRouter,
});
