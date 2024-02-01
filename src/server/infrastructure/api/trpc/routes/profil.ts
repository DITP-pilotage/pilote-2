import { créerRouteurTRPC, procédureProtégée } from '@/server/infrastructure/api/trpc/trpc';
import RécupérerListeProfilUseCase from '@/server/usecase/profil/RécupérerListeProfilUseCase';
import RécupérerUnProfilUseCase from '@/server/usecase/profil/RécupérerUnProfilUseCase';
import { validationProfilContexte } from '@/validation/profil';
import { dependencies } from '@/server/infrastructure/Dependencies';

export const profilRouter = créerRouteurTRPC({
  récupérerTous: procédureProtégée
    .query(() => {
      return new RécupérerListeProfilUseCase(dependencies.getProfilRepository()).run();
    }),

  récupérer: procédureProtégée
    .input(validationProfilContexte)
    .query(({ input }) => {
      return new RécupérerUnProfilUseCase(dependencies.getProfilRepository()).run(input.profilCode);
    }),
});
