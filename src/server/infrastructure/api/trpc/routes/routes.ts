import { créerRouteurTRPC } from '@/server/infrastructure/api/trpc/trpc';
import { utilisateurRouter } from '@/server/infrastructure/api/trpc/routes/utilisateur';
import { metadataIndicateurRouter } from '@/server/infrastructure/api/trpc/routes/metadataIndicateur';
import { chantierRouter } from './chantier';
import { synthèseDesRésultatsRouter } from './synthèseDesRésultats';
import { publicationRouter } from './publication';
import { indicateurRouter } from './indicateur';
import { territoireRouter } from './territoire';
import { périmètreMinistérielRouter } from './périmètreMinistériel';
import { profilRouter } from './profil';

export const appRouter = créerRouteurTRPC({
  chantier: chantierRouter,
  synthèseDesRésultats: synthèseDesRésultatsRouter,
  publication: publicationRouter,
  indicateur: indicateurRouter,
  territoire: territoireRouter,
  utilisateur: utilisateurRouter,
  metadataIndicateur: metadataIndicateurRouter,
  périmètreMinistériel: périmètreMinistérielRouter,
  profil: profilRouter,
});
