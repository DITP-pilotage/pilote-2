import { créerRouteurTRPC, procédureProtégée } from '@/server/infrastructure/api/trpc/trpc';
import RécupérerPérimètresMinistérielsUseCase from '@/server/usecase/périmètreMinistériel/RécupérerPérimètresMinistérielsUseCase';

export const périmètreMinistérielRouter = créerRouteurTRPC({
  récupérerTous: procédureProtégée
    .query(() => {
      return new RécupérerPérimètresMinistérielsUseCase().run();
    }),
});
