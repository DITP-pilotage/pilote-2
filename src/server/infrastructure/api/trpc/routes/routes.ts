import { créerRouteurTRPC } from '@/server/infrastructure/api/trpc/trpc';
import { utilisateurRouter } from '@/server/infrastructure/api/trpc/routes/utilisateur';
import { chantierRouter } from './chantier';
import { synthèseDesRésultatsRouter } from './synthèseDesRésultats';
import { publicationRouter } from './publication';
import { indicateurRouter } from './indicateur';
import { territoireRouter } from './territoire';
import { périmètreMinistérielRouter } from './périmètreMinistériel';

export const appRouter = créerRouteurTRPC({
  chantier: chantierRouter,
  synthèseDesRésultats: synthèseDesRésultatsRouter,
  publication: publicationRouter,
  indicateur: indicateurRouter,
  territoire: territoireRouter,
  utilisateur: utilisateurRouter,
  périmètreMinistériel: périmètreMinistérielRouter,
});
