import { créerRouteurTRPC, procédureProtégée } from '@/server/infrastructure/api/trpc/trpc';
import RécupérerPérimètresMinistérielsUseCase
  from '@/server/usecase/périmètreMinistériel/RécupérerPérimètresMinistérielsUseCase';
import { dependencies } from '@/server/infrastructure/Dependencies';

export const périmètreMinistérielRouter = créerRouteurTRPC({
  récupérerTous: procédureProtégée
    .query(() => {
      return new RécupérerPérimètresMinistérielsUseCase(dependencies.getPérimètreMinistérielRepository()).run();
    }),
});
