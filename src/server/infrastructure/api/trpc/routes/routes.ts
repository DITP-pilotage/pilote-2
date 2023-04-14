import { créerRouteurTRPC } from '@/server/infrastructure/api/trpc/trpc';
import { chantierDonnéesTerritorialesRouter } from './chantierDonnéesTerritoriales';
import { synthèseDesRésultatsRouter } from './synthèseDesRésultats';
import { commentaireRouter } from './commentaire';
import { publicationRouter } from './publication';

export const appRouter = créerRouteurTRPC({
  chantierDonnéesTerritoriales: chantierDonnéesTerritorialesRouter,
  synthèseDesRésultats: synthèseDesRésultatsRouter,
  commentaire: commentaireRouter,
  publication: publicationRouter,
});
